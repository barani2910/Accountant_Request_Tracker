USE accountant_tracker;

INSERT INTO clients (client_name, company_name, email, phone, address) VALUES
('ABC Corporation', 'ABC Corporation', 'accounts@abc-demo.example', '+1 555 0101', '120 Market Street'),
('XYZ Industries', 'XYZ Industries', 'finance@xyz-demo.example', '+1 555 0102', '48 River Road'),
('Demo Client Ltd', 'Demo Client Ltd', 'hello@demo-client.example', '+1 555 0103', '9 Garden Avenue');

INSERT INTO assignees (name, email, phone) VALUES
('Arun', 'arun@example.test', '+1 555 0201'),
('Ravi', 'ravi@example.test', '+1 555 0202'),
('Kumar', 'kumar@example.test', '+1 555 0203');

INSERT INTO requests (client_id, assignee_id, title, description, due_date, status) VALUES
(1, 1, 'Prepare GST report', 'Prepare the monthly GST report.', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Open'),
(1, 2, 'Review supplier invoices', 'Check and reconcile supplier invoices.', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'In Progress'),
(2, 2, 'Quarterly tax filing', 'Prepare quarterly tax documents.', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Open'),
(2, 3, 'Payroll reconciliation', 'Reconcile monthly payroll totals.', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'In Progress'),
(3, 1, 'Year-end statements', 'Compile the year-end financial statements.', DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'Completed'),
(3, 3, 'Bank statement review', 'Review and reconcile the latest statement.', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Completed');