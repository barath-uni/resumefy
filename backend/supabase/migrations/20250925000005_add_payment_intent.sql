-- Add payment_intent column to email_captures table
ALTER TABLE email_captures
ADD COLUMN payment_intent VARCHAR(50);

-- Add comment to describe the column
COMMENT ON COLUMN email_captures.payment_intent IS 'User response to payment upgrade question: yes, maybe, or no';
