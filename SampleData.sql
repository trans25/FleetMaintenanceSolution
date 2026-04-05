-- Fleet Maintenance System - Sample Data for Testing (Multi-Tenant South African Courier Companies)

USE FleetMaintenanceDB;
GO

-- Reset identity seeds to start from 1
DBCC CHECKIDENT ('Tenants', RESEED, 0);
DBCC CHECKIDENT ('Users', RESEED, 0);
DBCC CHECKIDENT ('Manufacturers', RESEED, 0);
DBCC CHECKIDENT ('Fleets', RESEED, 0);
DBCC CHECKIDENT ('Vehicles', RESEED, 0);
DBCC CHECKIDENT ('ServiceSchedules', RESEED, 0);
DBCC CHECKIDENT ('Faults', RESEED, 0);
GO

-- 1. Create test tenants (South African Courier Companies)
INSERT INTO Tenants (Name, ContactEmail, ContactPhone, IsActive, CreatedAt)
VALUES 
    ('The Courier Guy (Pty) Ltd', 'info@thecourierguy.co.za', '+27-11-555-0100', 1, GETUTCDATE()),
    ('Aramex South Africa', 'customercare@aramex.co.za', '+27-21-555-0200', 1, GETUTCDATE()),
    ('DHL Express South Africa', 'info@dhl.co.za', '+27-11-555-0300', 1, GETUTCDATE()),
    ('Pudo Locker Services', 'support@pudo.co.za', '+27-87-555-0400', 1, GETUTCDATE());
GO

-- 2. Create test users with simple passwords (for demo only!)
-- Password is stored as plain text for demo - in production use BCrypt!
INSERT INTO Users (TenantId, Username, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt)
VALUES 
    -- The Courier Guy users
    (1, 'admin', 'admin@thecourierguy.co.za', 'admin123', 'Thabo', 'Mokoena', 1, GETUTCDATE()),
    (1, 'technician1', 'tech1@thecourierguy.co.za', 'tech123', 'Sipho', 'Nkosi', 1, GETUTCDATE()),
    (1, 'driver1', 'driver1@thecourierguy.co.za', 'driver123', 'Zanele', 'Dlamini', 1, GETUTCDATE()),
    (1, 'driver2', 'driver2@thecourierguy.co.za', 'driver123', 'Lerato', 'Makgatho', 1, GETUTCDATE()),
    -- Aramex users
    (2, 'admin.aramex', 'admin@aramex.co.za', 'admin123', 'Ahmed', 'Hassan', 1, GETUTCDATE()),
    (2, 'tech.aramex', 'tech@aramex.co.za', 'tech123', 'Fatima', 'Patel', 1, GETUTCDATE()),
    (2, 'driver.aramex', 'driver@aramex.co.za', 'driver123', 'Mandla', 'Zulu', 1, GETUTCDATE()),
    -- DHL users
    (3, 'admin.dhl', 'admin@dhl.co.za', 'admin123', 'Johan', 'Van Der Merwe', 1, GETUTCDATE()),
    (3, 'tech.dhl', 'tech@dhl.co.za', 'tech123', 'Precious', 'Mthembu', 1, GETUTCDATE()),
    (3, 'driver.dhl', 'driver@dhl.co.za', 'driver123', 'Bongani', 'Khumalo', 1, GETUTCDATE()),
    -- Pudo users
    (4, 'admin.pudo', 'admin@pudo.co.za', 'admin123', 'Sarah', 'Botha', 1, GETUTCDATE()),
    (4, 'tech.pudo', 'tech@pudo.co.za', 'tech123', 'Themba', 'Ndlovu', 1, GETUTCDATE());
GO

-- 3. Assign roles to users
INSERT INTO UserRoles (UsersId, RolesId) 
VALUES 
    -- The Courier Guy
    (1, 1),   -- admin -> SystemAdmin
    (2, 3),   -- technician1 -> Technician
    (3, 4),   -- driver1 -> Driver
    (4, 4),   -- driver2 -> Driver
    -- Aramex
    (5, 2),   -- admin.aramex -> TenantAdmin
    (6, 3),   -- tech.aramex -> Technician
    (7, 4),   -- driver.aramex -> Driver
    -- DHL
    (8, 2),   -- admin.dhl -> TenantAdmin
    (9, 3),   -- tech.dhl -> Technician
    (10, 4),  -- driver.dhl -> Driver
    -- Pudo
    (11, 2),  -- admin.pudo -> TenantAdmin
    (12, 3);  -- tech.pudo -> Technician
GO

-- 4. Create manufacturers
INSERT INTO Manufacturers (Name, Country, Website, CreatedAt)
VALUES 
    ('Toyota', 'Japan', 'https://www.toyota.com', GETUTCDATE()),
    ('Ford', 'USA', 'https://www.ford.com', GETUTCDATE()),
    ('Mercedes-Benz', 'Germany', 'https://www.mercedes-benz.com', GETUTCDATE()),
    ('Nissan', 'Japan', 'https://www.nissan.co.za', GETUTCDATE()),
    ('Isuzu', 'Japan', 'https://www.isuzu.co.za', GETUTCDATE()),
    ('Volkswagen', 'Germany', 'https://www.vw.co.za', GETUTCDATE());
GO

-- 5. Create fleets
INSERT INTO Fleets (TenantId, Name, Description, Location, IsActive, CreatedAt)
VALUES 
    -- The Courier Guy fleets
    (1, 'Johannesburg Fleet', 'Primary vehicle fleet for Gauteng operations', 'Johannesburg HQ - Sandton', 1, GETUTCDATE()),
    (1, 'Cape Town Fleet', 'Fleet for Western Cape deliveries', 'Cape Town Hub - Century City', 1, GETUTCDATE()),
    (1, 'Durban Fleet', 'KwaZulu-Natal coastal fleet', 'Durban Hub - Umhlanga', 1, GETUTCDATE()),
    -- Aramex fleets
    (2, 'Aramex Gauteng', 'Gauteng province operations', 'Midrand Distribution Center', 1, GETUTCDATE()),
    (2, 'Aramex Western Cape', 'Western Cape operations', 'Cape Town Airport Hub', 1, GETUTCDATE()),
    -- DHL fleets
    (3, 'DHL Express JHB', 'Johannesburg express delivery', 'OR Tambo Airport', 1, GETUTCDATE()),
    (3, 'DHL Express CPT', 'Cape Town express delivery', 'Cape Town International', 1, GETUTCDATE()),
    -- Pudo fleets
    (4, 'Pudo Locker Service', 'Locker delivery vehicles', 'Centurion Hub', 1, GETUTCDATE());
GO

-- 6. Create test vehicles (South African registrations)
INSERT INTO Vehicles (FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, LastServiceDate, CreatedAt)
VALUES 
    -- The Courier Guy - Johannesburg Fleet
    (1, 1, 'CA 123-456 GP', '1HGBH41JXMN109186', 'Toyota Hilux 2.8 GD-6', 2023, 'White', 45000.50, 'Active', '2023-01-15', '2024-03-01', GETUTCDATE()),
    (1, 1, 'CA 789-012 GP', '2HGBH41JXMN109287', 'Toyota Quantum 2.5 D-4D', 2023, 'Silver', 38500.00, 'Active', '2023-02-20', '2024-02-15', GETUTCDATE()),
    (1, 2, 'CB 345-678 GP', '3HGBH41JXMN109388', 'Ford Ranger 3.2', 2024, 'Blue', 15000.00, 'Active', '2024-01-10', NULL, GETUTCDATE()),
    (1, 5, 'CE 111-222 GP', '6HGBH41JXMN109691', 'Isuzu D-Max 3.0', 2023, 'Red', 52000.00, 'Active', '2023-03-10', '2024-03-05', GETUTCDATE()),
    -- The Courier Guy - Cape Town Fleet
    (2, 1, 'CC 901-234 WC', '4HGBH41JXMN109489', 'Toyota Land Cruiser', 2024, 'Black', 12500.00, 'Active', '2024-01-15', NULL, GETUTCDATE()),
    (2, 3, 'CD 567-890 WC', '5HGBH41JXMN109590', 'Mercedes-Benz Sprinter 516', 2023, 'White', 62000.00, 'Active', '2023-06-01', '2024-03-20', GETUTCDATE()),
    (2, 6, 'CF 333-444 WC', '7HGBH41JXMN109792', 'VW Amarok 2.0 BiTDI', 2024, 'Grey', 8500.00, 'Active', '2024-02-01', NULL, GETUTCDATE()),
    -- The Courier Guy - Durban Fleet
    (3, 1, 'CG 555-666 KZN', '8HGBH41JXMN109893', 'Toyota Hilux 2.4 GD-6', 2023, 'White', 41000.00, 'Active', '2023-05-15', '2024-02-28', GETUTCDATE()),
    (3, 4, 'CH 777-888 KZN', '9HGBH41JXMN109994', 'Nissan NP300 Hardbody', 2022, 'Silver', 68000.00, 'Active', '2022-08-20', '2024-03-10', GETUTCDATE()),
    -- Aramex - Gauteng
    (4, 3, 'CI 999-000 GP', 'AHGBH41JXMN110095', 'Mercedes-Benz Sprinter 315', 2024, 'Red', 5200.00, 'Active', '2024-03-01', NULL, GETUTCDATE()),
    (4, 3, 'CJ 111-222 GP', 'BHGBH41JXMN110196', 'Mercedes-Benz Vito 116', 2023, 'Red', 28000.00, 'Active', '2023-09-15', '2024-03-12', GETUTCDATE()),
    (4, 5, 'CK 333-444 GP', 'CHGBH41JXMN110297', 'Isuzu NPR 400', 2023, 'White', 35000.00, 'Active', '2023-07-01', '2024-02-20', GETUTCDATE()),
    -- Aramex - Western Cape
    (5, 3, 'CL 555-666 WC', 'DHGBH41JXMN110398', 'Mercedes-Benz Sprinter 516', 2024, 'Red', 3800.00, 'Active', '2024-03-15', NULL, GETUTCDATE()),
    (5, 1, 'CM 777-888 WC', 'EHGBH41JXMN110499', 'Toyota Hiace 2.7', 2022, 'White', 72000.00, 'Active', '2022-11-10', '2024-03-08', GETUTCDATE()),
    -- DHL - JHB
    (6, 3, 'CN 999-000 GP', 'FHGBH41JXMN110500', 'Mercedes-Benz Sprinter 519', 2024, 'Yellow', 2100.00, 'Active', '2024-04-01', NULL, GETUTCDATE()),
    (6, 6, 'CO 111-222 GP', 'GHGBH41JXMN110601', 'VW Crafter 50', 2023, 'Yellow', 22000.00, 'Active', '2023-10-15', '2024-03-15', GETUTCDATE()),
    (6, 2, 'CP 333-444 GP', 'HHGBH41JXMN110702', 'Ford Transit Custom', 2023, 'Yellow', 31500.00, 'Active', '2023-08-01', '2024-02-25', GETUTCDATE()),
    -- DHL - CPT
    (7, 3, 'CQ 555-666 WC', 'IHGBH41JXMN110803', 'Mercedes-Benz Sprinter 516', 2024, 'Yellow', 4500.00, 'Active', '2024-03-10', NULL, GETUTCDATE()),
    (7, 1, 'CR 777-888 WC', 'JHGBH41JXMN110904', 'Toyota Quantum 2.7', 2023, 'Yellow', 38000.00, 'Active', '2023-06-20', '2024-03-01', GETUTCDATE()),
    -- Pudo
    (8, 4, 'CS 999-111 GP', 'KHGBH41JXMN111005', 'Nissan NP200 1.5', 2022, 'Green', 95000.00, 'Active', '2022-05-15', '2024-03-18', GETUTCDATE()),
    (8, 4, 'CT 222-333 GP', 'LHGBH41JXMN111106', 'Nissan NV350 Impendulo', 2023, 'Green', 44000.00, 'Active', '2023-04-01', '2024-02-10', GETUTCDATE()),
    (8, 1, 'CU 444-555 GP', 'MHGBH41JXMN111207', 'Toyota Avanza 1.5', 2024, 'Green', 6200.00, 'Active', '2024-02-15', NULL, GETUTCDATE());
GO

-- 7. Create service schedules
INSERT INTO ServiceSchedules (VehicleId, ServiceType, Description, ScheduledDate, CompletedDate, MileageAtService, Status, Notes, CreatedAt)
VALUES 
    (1, 'Oil Change', 'Regular oil change and filter replacement', '2026-05-15', NULL, 45000.50, 'Scheduled', 'Due soon', GETUTCDATE()),
    (2, 'Tire Rotation', 'Rotate tires and check alignment', '2026-05-20', NULL, 38500.00, 'Scheduled', NULL, GETUTCDATE()),
    (6, 'Annual Inspection', 'Annual safety inspection', '2026-06-01', NULL, 62000.00, 'Scheduled', 'Required by law', GETUTCDATE()),
    (10, 'Major Service', '60,000km major service', '2026-05-10', NULL, 5200.00, 'Scheduled', 'Includes timing belt check', GETUTCDATE()),
    (15, 'Brake Service', 'Replace brake pads and discs', '2026-04-20', NULL, 2100.00, 'Scheduled', 'Due for safety', GETUTCDATE()),
    (4, 'Oil and Filter Change', 'Standard service', '2026-05-25', NULL, 52000.00, 'Scheduled', NULL, GETUTCDATE()),
    (12, 'Annual Service', 'Comprehensive annual service', '2026-06-15', NULL, 35000.00, 'Scheduled', NULL, GETUTCDATE()),
    (18, 'Minor Service', '30,000km service', '2026-04-30', NULL, 31500.00, 'Scheduled', NULL, GETUTCDATE());
GO

-- 8. Create fault reports
INSERT INTO Faults (VehicleId, Title, Description, Severity, Status, ReportedDate, ResolvedDate, ReportedByUserId, CreatedAt)
VALUES 
    (1, 'Check Engine Light', 'Engine warning light is on', 'Medium', 'Reported', '2026-04-01', NULL, 3, GETUTCDATE()),
    (3, 'Brake Noise', 'Squeaking noise when braking', 'High', 'InProgress', '2026-03-28', NULL, 3, GETUTCDATE()),
    (6, 'AC Not Working', 'Air conditioning not cooling properly', 'Low', 'Reported', '2026-04-03', NULL, 4, GETUTCDATE()),
    (9, 'Flat Tire', 'Front left tire punctured', 'Medium', 'Resolved', '2026-03-15', '2026-03-15', 7, GETUTCDATE()),
    (15, 'Battery Warning', 'Battery warning light illuminated', 'High', 'InProgress', '2026-04-02', NULL, 10, GETUTCDATE()),
    (11, 'Suspension Noise', 'Knocking sound from rear suspension', 'Medium', 'Reported', '2026-04-04', NULL, 7, GETUTCDATE()),
    (17, 'Fuel Leak', 'Small fuel leak detected', 'Critical', 'InProgress', '2026-04-01', NULL, 10, GETUTCDATE()),
    (20, 'Transmission Slip', 'Transmission slipping in 3rd gear', 'High', 'Reported', '2026-04-03', NULL, 3, GETUTCDATE());
GO

PRINT 'Sample data inserted successfully!';
PRINT '';
PRINT '=== Test Credentials ===';
PRINT '';
PRINT '** The Courier Guy **';
PRINT '  Admin: admin / admin123 (Thabo Mokoena)';
PRINT '  Technician: technician1 / tech123 (Sipho Nkosi)';
PRINT '  Drivers: driver1, driver2 / driver123';
PRINT '';
PRINT '** Aramex **';
PRINT '  Admin: admin.aramex / admin123 (Ahmed Hassan)';
PRINT '  Technician: tech.aramex / tech123 (Fatima Patel)';
PRINT '  Driver: driver.aramex / driver123 (Mandla Zulu)';
PRINT '';
PRINT '** DHL Express **';
PRINT '  Admin: admin.dhl / admin123 (Johan Van Der Merwe)';
PRINT '  Technician: tech.dhl / tech123 (Precious Mthembu)';
PRINT '  Driver: driver.dhl / driver123 (Bongani Khumalo)';
PRINT '';
PRINT '** Pudo Locker **';
PRINT '  Admin: admin.pudo / admin123 (Sarah Botha)';
PRINT '  Technician: tech.pudo / tech123 (Themba Ndlovu)';
GO

-- View summary
SELECT 
    (SELECT COUNT(*) FROM Tenants) AS Tenants,
    (SELECT COUNT(*) FROM Users) AS Users,
    (SELECT COUNT(*) FROM Roles) AS Roles,
    (SELECT COUNT(*) FROM Fleets) AS Fleets,
    (SELECT COUNT(*) FROM Manufacturers) AS Manufacturers,
    (SELECT COUNT(*) FROM Vehicles) AS Vehicles,
    (SELECT COUNT(*) FROM ServiceSchedules) AS ServiceSchedules,
    (SELECT COUNT(*) FROM Faults) AS Faults,
    (SELECT COUNT(*) FROM JobCards) AS JobCards,
    (SELECT COUNT(*) FROM JobCardTasks) AS JobCardTasks;
GO
