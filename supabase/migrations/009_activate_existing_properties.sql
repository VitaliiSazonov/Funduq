-- ═══════════════════════════════════════════════════════════════
-- Phase 9: Activate all existing properties that are in pending_review
-- 
-- Context: Properties were submitted with status 'pending_review' 
-- (per migration 006) but were never approved by an admin.
-- The host dashboard was showing them as "ACTIVE" due to a 
-- missing status field in the Property transform, creating confusion.
--
-- This migration activates all pending_review properties.
-- Going forward, new submissions will still require admin approval.
-- ═══════════════════════════════════════════════════════════════

UPDATE public.properties
SET status = 'active', updated_at = NOW()
WHERE status = 'pending_review';
