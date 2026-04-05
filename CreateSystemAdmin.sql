-- Create System Admin User: mashiaes@gmail.com
-- Password: test123..

-- First, ensure we have the default tenant
IF NOT EXISTS (SELECT 1 FROM Tenants WHERE Id = 1)
BEGIN
    SET IDENTITY_INSERT Tenants ON;
    INSERT INTO Tenants (Id, Name, ContactEmail, ContactPhone, IsActive, CreatedAt)
    VALUES (1, 'Default Tenant', 'admin@system.com', '+1234567890', 1, GETUTCDATE());
    SET IDENTITY_INSERT Tenants OFF;
END

-- Ensure SystemAdmin role exists
IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'SystemAdmin')
BEGIN
    SET IDENTITY_INSERT Roles ON;
    INSERT INTO Roles (Id, Name, Description, CreatedAt)
    VALUES (1, 'SystemAdmin', 'Full system access across all tenants', GETUTCDATE());
    SET IDENTITY_INSERT Roles OFF;
END

-- Create the system admin user
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'mashiaes@gmail.com')
BEGIN
    INSERT INTO Users (TenantId, Username, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt)
    VALUES (1, 'mashiaes', 'mashiaes@gmail.com', 'test123..', 'Elias', 'Mashia', 1, GETUTCDATE());
    
    -- Get the ID of the newly created user
    DECLARE @UserId INT = SCOPE_IDENTITY();
    
    -- Assign SystemAdmin role (RoleId = 1)
    INSERT INTO UserRoles (RolesId, UsersId)
    VALUES (1, @UserId);
    
    PRINT 'System Admin user created successfully!';
    PRINT 'Email: mashiaes@gmail.com';
    PRINT 'Password: test123..';
END
ELSE
BEGIN
    -- Update existing user and ensure they have SystemAdmin role
    UPDATE Users 
    SET PasswordHash = 'test123..', IsActive = 1
    WHERE Email = 'mashiaes@gmail.com';
    
    DECLARE @ExistingUserId INT = (SELECT Id FROM Users WHERE Email = 'mashiaes@gmail.com');
    
    -- Ensure user has SystemAdmin role
    IF NOT EXISTS (SELECT 1 FROM UserRoles WHERE RolesId = 1 AND UsersId = @ExistingUserId)
    BEGIN
        INSERT INTO UserRoles (RolesId, UsersId)
        VALUES (1, @ExistingUserId);
    END
    
    PRINT 'Existing user updated with SystemAdmin role!';
    PRINT 'Email: mashiaes@gmail.com';
    PRINT 'Password: test123..';
END
