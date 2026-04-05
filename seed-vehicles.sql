-- Seed Manufacturers
IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Id = 1)
    INSERT INTO Manufacturers (Id, Name, Country, Website, CreatedAt) 
    VALUES (1, 'Toyota', 'Japan', 'https://www.toyota.com', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Id = 2)
    INSERT INTO Manufacturers (Id, Name, Country, Website, CreatedAt) 
    VALUES (2, 'Ford', 'USA', 'https://www.ford.com', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Id = 3)
    INSERT INTO Manufacturers (Id, Name, Country, Website, CreatedAt) 
    VALUES (3, 'Mercedes-Benz', 'Germany', 'https://www.mercedes-benz.com', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Id = 4)
    INSERT INTO Manufacturers (Id, Name, Country, Website, CreatedAt) 
    VALUES (4, 'Volkswagen', 'Germany', 'https://www.volkswagen.com', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Id = 5)
    INSERT INTO Manufacturers (Id, Name, Country, Website, CreatedAt) 
    VALUES (5, 'Chevrolet', 'USA', 'https://www.chevrolet.com', GETUTCDATE());

-- Seed Fleets (assuming TenantId = 1 exists)
IF NOT EXISTS (SELECT 1 FROM Fleets WHERE Id = 1)
    INSERT INTO Fleets (Id, TenantId, Name, Description, Location, IsActive, CreatedAt) 
    VALUES (1, 1, 'Delivery Fleet', 'Main delivery vehicles for daily operations', 'New York, NY', 1, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Fleets WHERE Id = 2)
    INSERT INTO Fleets (Id, TenantId, Name, Description, Location, IsActive, CreatedAt) 
    VALUES (2, 1, 'Executive Fleet', 'Executive and business travel vehicles', 'New York, NY', 1, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Fleets WHERE Id = 3)
    INSERT INTO Fleets (Id, TenantId, Name, Description, Location, IsActive, CreatedAt) 
    VALUES (3, 1, 'Service Fleet', 'Service and maintenance vehicles', 'Brooklyn, NY', 1, GETUTCDATE());

-- Seed Vehicles
IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE Id = 1)
    INSERT INTO Vehicles (Id, FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
    VALUES (1, 1, 1, 'ABC-1234', '1HGBH41JXMN109186', 'Hilux', 2023, 'White', 15000, 'Active', '2023-01-15', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE Id = 2)
    INSERT INTO Vehicles (Id, FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
    VALUES (2, 1, 2, 'XYZ-5678', '2FMDK3GC8BBA12345', 'F-150', 2022, 'Blue', 32000, 'Active', '2022-06-20', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE Id = 3)
    INSERT INTO Vehicles (Id, FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
    VALUES (3, 2, 3, 'LMN-9012', 'WDB1234567890ABCD', 'E-Class', 2024, 'Black', 5000, 'Active', '2024-02-10', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE Id = 4)
    INSERT INTO Vehicles (Id, FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
    VALUES (4, 1, 4, 'DEF-3456', '3VWDX7AJ9CM123456', 'Crafter Van', 2023, 'Silver', 28000, 'Active', '2023-05-15', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE Id = 5)
    INSERT INTO Vehicles (Id, FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
    VALUES (5, 3, 5, 'GHI-7890', '1G1ZD5ST5JF123456', 'Silverado', 2023, 'Red', 18000, 'Maintenance', '2023-03-01', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE Id = 6)
    INSERT INTO Vehicles (Id, FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
    VALUES (6, 1, 1, 'JKL-2468', '5TFUY5F18LX123456', 'Camry', 2024, 'Grey', 8000, 'Active', '2024-01-05', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE Id = 7)
    INSERT INTO Vehicles (Id, FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
    VALUES (7, 2, 3, 'MNO-1357', 'WDDZF4JB0LA123456', 'Sprinter Van', 2023, 'White', 22000, 'Active', '2023-07-12', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE Id = 8)
    INSERT INTO Vehicles (Id, FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
    VALUES (8, 1, 2, 'PQR-8024', '1FTFW1ET5DFC12345', 'Transit Van', 2022, 'White', 45000, 'Active', '2022-04-18', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE Id = 9)
    INSERT INTO Vehicles (Id, FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
    VALUES (9, 3, 4, 'STU-6913', 'WVWZZZ3CZBE123456', 'Amarok', 2023, 'Blue', 12000, 'Active', '2023-08-25', GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE Id = 10)
    INSERT INTO Vehicles (Id, FleetId, ManufacturerId, RegistrationNumber, VIN, Model, Year, Color, Mileage, Status, PurchaseDate, CreatedAt)
    VALUES (10, 1, 5, 'VWX-4680', '1GCVKPEC8EZ123456', 'Express Cargo Van', 2022, 'White', 38000, 'Active', '2022-09-30', GETUTCDATE());

PRINT 'Vehicle seed data inserted successfully!';
