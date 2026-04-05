-- Fleet Management System - Seed Data Script
-- This script creates initial tenants, roles, and users for testing

-- Enable identity insert for seeding specific IDs
SET IDENTITY_INSERT Tenants ON;
SET IDENTITY_INSERT Roles ON;
SET IDENTITY_INSERT Users ON;

-- Insert Default Tenant (if not exists)
IF NOT EXISTS (SELECT 1 FROM Tenants WHERE Id = 1)
BEGIN
    INSERT INTO Tenants (Id, Name, ContactEmail, ContactPhone, IsActive, CreatedAt)
    VALUES (1, 'Default Tenant', 'admin@defaulttenant.com', '+1234567890', 1, GETUTCDATE());
END

-- Insert Additional Test Tenant
IF NOT EXISTS (SELECT 1 FROM Tenants WHERE Id = 2)
BEGIN
    INSERT INTO Tenants (Id, Name, ContactEmail, ContactPhone, IsActive, CreatedAt)
    VALUES (2, 'Acme Corporation', 'admin@acmecorp.com', '+9876543210', 1, GETUTCDATE());
END

-- Insert Roles (if not exists)
IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'SystemAdmin')
BEGIN
    INSERT INTO Roles (Id, Name, Description, CreatedAt)
    VALUES 
        (1, 'SystemAdmin', 'Full system access across all tenants', GETUTCDATE()),
        (2, 'TenantAdmin', 'Full access within tenant scope', GETUTCDATE()),
        (3, 'FleetManager', 'Manage fleet operations and assignments', GETUTCDATE()),
        (4, 'Technician', 'Perform maintenance and repairs', GETUTCDATE()),
        (5, 'Staff', 'Basic access to view and update assigned tasks', GETUTCDATE()),
        (6, 'Auditor', 'Read-only access for auditing purposes', GETUTCDATE()),
        (7, 'Guest', 'Limited read-only access', GETUTCDATE());
END

-- Insert Test Users (if not exists)
-- Password for all users: "password123" (plain text for demo - in production use hashed passwords)

-- System Admin User
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Id, TenantId, Username, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt)
    VALUES (1, 1, 'admin', 'admin@system.com', 'password123', 'System', 'Administrator', 1, GETUTCDATE());
END

-- Tenant Admin User for Default Tenant
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'tenant1admin')
BEGIN
    INSERT INTO Users (Id, TenantId, Username, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt)
    VALUES (2, 1, 'tenant1admin', 'admin@defaulttenant.com', 'password123', 'Default', 'Admin', 1, GETUTCDATE());
END

-- Fleet Manager for Default Tenant
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'fleetmanager1')
BEGIN
    INSERT INTO Users (Id, TenantId, Username, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt)
    VALUES (3, 1, 'fleetmanager1', 'manager@defaulttenant.com', 'password123', 'Fleet', 'Manager', 1, GETUTCDATE());
END

-- Technician for Default Tenant
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'tech1')
BEGIN
    INSERT INTO Users (Id, TenantId, Username, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt)
    VALUES (4, 1, 'tech1', 'tech1@defaulttenant.com', 'password123', 'John', 'Technician', 1, GETUTCDATE());
END

-- Tenant Admin for Acme Corporation
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'acmeadmin')
BEGIN
    INSERT INTO Users (Id, TenantId, Username, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt)
    VALUES (5, 2, 'acmeadmin', 'admin@acmecorp.com', 'password123', 'Acme', 'Admin', 1, GETUTCDATE());
END

-- Fleet Manager for Acme Corporation
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'acmemanager')
BEGIN
    INSERT INTO Users (Id, TenantId, Username, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt)
    VALUES (6, 2, 'acmemanager', 'manager@acmecorp.com', 'password123', 'Acme', 'Manager', 1, GETUTCDATE());
END

SET IDENTITY_INSERT Users OFF;
SET IDENTITY_INSERT Roles OFF;
SET IDENTITY_INSERT Tenants OFF;

-- Assign Roles to Users (Many-to-Many relationship)
-- Note: RoleUser is the join table created by EF Core for the many-to-many relationship

-- System Admin gets SystemAdmin role
IF NOT EXISTS (SELECT 1 FROM RoleUser WHERE UsersId = 1 AND RolesId = 1)
BEGIN
    INSERT INTO RoleUser (RolesId, UsersId) VALUES (1, 1); -- admin -> SystemAdmin
END

-- Tenant1 Admin gets TenantAdmin role
IF NOT EXISTS (SELECT 1 FROM RoleUser WHERE UsersId = 2 AND RolesId = 2)
BEGIN
    INSERT INTO RoleUser (RolesId, UsersId) VALUES (2, 2); -- tenant1admin -> TenantAdmin
END

-- Fleet Manager 1 gets FleetManager role
IF NOT EXISTS (SELECT 1 FROM RoleUser WHERE UsersId = 3 AND RolesId = 3)
BEGIN
    INSERT INTO RoleUser (RolesId, UsersId) VALUES (3, 3); -- fleetmanager1 -> FleetManager
END

-- Technician 1 gets Technician role
IF NOT EXISTS (SELECT 1 FROM RoleUser WHERE UsersId = 4 AND RolesId = 4)
BEGIN
    INSERT INTO RoleUser (RolesId, UsersId) VALUES (4, 4); -- tech1 -> Technician
END

-- Acme Admin gets TenantAdmin role
IF NOT EXISTS (SELECT 1 FROM RoleUser WHERE UsersId = 5 AND RolesId = 2)
BEGIN
    INSERT INTO RoleUser (RolesId, UsersId) VALUES (2, 5); -- acmeadmin -> TenantAdmin
END

-- Acme Manager gets FleetManager role
IF NOT EXISTS (SELECT 1 FROM RoleUser WHERE UsersId = 6 AND RolesId = 3)
BEGIN
    INSERT INTO RoleUser (RolesId, UsersId) VALUES (3, 6); -- acmemanager -> FleetManager
END

PRINT 'Seed data inserted successfully!';
PRINT '';
PRINT '=== Test User Credentials ===';
PRINT 'All users have password: password123';
PRINT '';
PRINT 'System Admin:';
PRINT '  Username: admin';
PRINT '  Role: SystemAdmin';
PRINT '  Can see ALL tenant data';
PRINT '';
PRINT 'Default Tenant Users (TenantId = 1):';
PRINT '  Username: tenant1admin  | Role: TenantAdmin';
PRINT '  Username: fleetmanager1 | Role: FleetManager';
PRINT '  Username: tech1         | Role: Technician';
PRINT '';
PRINT 'Acme Corporation Users (TenantId = 2):';
PRINT '  Username: acmeadmin     | Role: TenantAdmin';
PRINT '  Username: acmemanager   | Role: FleetManager';
PRINT '';
