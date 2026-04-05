SELECT u.Id, u.Username, u.Email, u.FirstName, u.LastName, u.IsActive, 
       STRING_AGG(r.Name, ', ') as Roles
FROM Users u
LEFT JOIN UserRoles ur ON u.Id = ur.UsersId
LEFT JOIN Roles r ON ur.RolesId = r.Id
GROUP BY u.Id, u.Username, u.Email, u.FirstName, u.LastName, u.IsActive;
