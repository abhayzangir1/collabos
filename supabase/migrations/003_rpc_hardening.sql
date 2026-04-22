-- CollabOS: RPC Hardening for Race Conditions
-- Run this in the Supabase SQL Editor

-- 1. Atomic Milestone Confirmation
-- Safely confirms a milestone and automatically transitions trade states
-- preventing race conditions when both parties confirm simultaneously.

CREATE OR REPLACE FUNCTION confirm_milestone(p_milestone_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_trade RECORD;
  v_milestone RECORD;
  v_is_proposer BOOLEAN;
BEGIN
  -- Lock the milestone row to prevent concurrent race conditions
  SELECT * INTO v_milestone FROM milestones WHERE id = p_milestone_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Milestone not found';
  END IF;

  -- Lock the trade row to verify permissions
  SELECT * INTO v_trade FROM trades WHERE id = v_milestone.trade_id FOR SHARE;
  
  IF v_trade.proposer_user_id = p_user_id THEN
    v_is_proposer := TRUE;
  ELSIF v_trade.recipient_user_id = p_user_id THEN
    v_is_proposer := FALSE;
  ELSE
    RAISE EXCEPTION 'User is not a participant in this trade';
  END IF;

  -- Check for open disputes
  IF EXISTS (
    SELECT 1 FROM disputes 
    WHERE milestone_id = p_milestone_id 
    AND status IN ('Open', 'Under Review')
  ) THEN
    RAISE EXCEPTION 'Cannot confirm milestone while a dispute is open';
  END IF;

  -- Apply confirmation in memory
  IF v_is_proposer THEN
    v_milestone.party_a_confirmed := TRUE;
  ELSE
    v_milestone.party_b_confirmed := TRUE;
  END IF;

  -- Check if both confirmed
  IF v_milestone.party_a_confirmed AND v_milestone.party_b_confirmed THEN
    -- Update milestone to completed
    UPDATE milestones 
    SET party_a_confirmed = v_milestone.party_a_confirmed, 
        party_b_confirmed = v_milestone.party_b_confirmed, 
        status = 'Completed' 
    WHERE id = p_milestone_id;
    
    -- Check if all milestones for this trade are completed
    IF NOT EXISTS (
      SELECT 1 FROM milestones 
      WHERE trade_id = v_trade.id 
      AND id != p_milestone_id 
      AND status != 'Completed'
    ) THEN
      -- Complete trade (Trust score recalculation is handled by trigger)
      UPDATE trades SET status = 'Completed', completed_at = NOW() WHERE id = v_trade.id;
    ELSE
      -- Advance next milestone
      UPDATE milestones SET status = 'In Progress' 
      WHERE trade_id = v_trade.id 
      AND sequence = v_milestone.sequence + 1;
    END IF;
  ELSE
    -- Wait for other party
    UPDATE milestones 
    SET party_a_confirmed = v_milestone.party_a_confirmed, 
        party_b_confirmed = v_milestone.party_b_confirmed, 
        status = 'Awaiting Confirmation' 
    WHERE id = p_milestone_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Atomic Message Reactions
-- Safely toggles an emoji reaction in the JSONB array without losing concurrent updates.

CREATE OR REPLACE FUNCTION toggle_message_reaction(p_message_id UUID, p_user_id UUID, p_emoji TEXT)
RETURNS JSONB AS $$
DECLARE
  v_message RECORD;
  v_reactions JSONB;
  v_users JSONB;
  v_index INT;
BEGIN
  -- Lock message row
  SELECT * INTO v_message FROM messages WHERE id = p_message_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  v_reactions := v_message.reactions;
  
  -- If emoji doesn't exist, create it
  IF NOT v_reactions ? p_emoji THEN
    v_reactions := jsonb_set(v_reactions, ARRAY[p_emoji], jsonb_build_array(p_user_id));
  ELSE
    v_users := v_reactions->p_emoji;
    
    -- Find index of user
    v_index := -1;
    SELECT position - 1 INTO v_index
    FROM jsonb_array_elements_text(v_users) WITH ORDINALITY arr(elem, position)
    WHERE elem = p_user_id::text;
    
    IF v_index >= 0 THEN
      -- Remove user
      v_users := v_users - v_index;
    ELSE
      -- Add user
      v_users := v_users || jsonb_build_array(p_user_id);
    END IF;
    
    v_reactions := jsonb_set(v_reactions, ARRAY[p_emoji], v_users);
  END IF;

  UPDATE messages SET reactions = v_reactions WHERE id = p_message_id;
  RETURN jsonb_build_object('success', true, 'reactions', v_reactions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
