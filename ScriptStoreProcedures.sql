-- Las contraseñas se reciben como string de js
-- Lo de la encriptación se hace en la base de datos, cuando hacemos la consulta en la base de datos ya salen encriptados


--Parámetros (correo y contraseña ambos strings)
--Valores de retorno (1; existe el correo, 0; no existe el correo)
ALTER PROCEDURE sp_IniciarSesion
    @inCorreo VARCHAR(50),
    @inContrasena VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF EXISTS (
            SELECT 1 FROM dbo.Usuario 
            WHERE CorreoElectronico = @inCorreo 
            AND Contrasena = HASHBYTES('SHA2_512', @inContrasena)
        )
        BEGIN
            -- Código 0 = a éxito
            SELECT 
                0 AS Codigo,
                'Login exitoso' AS Mensaje,
                idUsuario, 
                NombreUsuario, 
                ApellidoUsuario, 
                CorreoElectronico, 
                Rol, 
                Carnet 
            FROM dbo.Usuario
            WHERE CorreoElectronico = @inCorreo;
        END


        ELSE
        BEGIN
            -- Código 1: credenciales incorrectas
            SELECT 1 AS Codigo, 'Correo o contraseña incorrectos' AS Mensaje;
        END
    END TRY
    BEGIN CATCH
        SELECT ERROR_NUMBER() AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;


-- Parámetros (nombre, apellidos, correo, contraseña y número de carnet)
-- Valores de retorno (1; ya existe el correo de parámetro, 2; ya existe el carnet de parámetro, 0; inserción exitosa)
ALTER PROCEDURE sp_RegistrarUsuario
    @inNombre VARCHAR(100),
    @inApellido VARCHAR(100),
    @inCorreo VARCHAR(50),
    @inContrasena VARCHAR(100), 
    @inCarnet VARCHAR(45)
AS
BEGIN
    SET NOCOUNT ON;

    --Verificación de Correo
    IF EXISTS (SELECT 1 FROM Usuario WHERE CorreoElectronico = @inCorreo)
    BEGIN
        SELECT 1 AS Codigo, 'El correo ya existe' AS Mensaje;
        RETURN;
    END

    --Verificación de Carnet
    IF EXISTS (SELECT 1 FROM Usuario WHERE Carnet = @inCarnet)
    BEGIN
        SELECT 2 AS Codigo, 'El carnet ya existe' AS Mensaje;
        RETURN;
    END

    -- Insertar
    BEGIN TRY
        INSERT INTO Usuario (NombreUsuario, ApellidoUsuario, CorreoElectronico, Contrasena, Rol, Carnet, FechaRegistro)
        VALUES (@inNombre, @inApellido, @inCorreo, HASHBYTES('SHA2_512', @inContrasena), 'ASISTENTE', @inCarnet, CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Central Standard Time' AS DATETIME));

        SELECT 0 AS Codigo, 'Usuario registrado con éxito' AS Mensaje;
    END TRY
    BEGIN CATCH
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;







-- Parámetros (datos del evento)
-- Valores de retorno (1; ya existe el correo de parámetro, 2; ya existe el carnet de parámetro, 0; inserción exitosa)
CREATE PROCEDURE sp_CrearEvento
    @inNombreEvento VARCHAR(60),
    @inidOrganizador INT,
    @inCategoria VARCHAR(45),
    @inFechaEvento DATETIME, 
    @inModalidad VARCHAR(20), -- Agregado para que coincida con tu tabla
    @inEnlacePlenaria VARCHAR(45)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF EXISTS (
            SELECT 1 FROM dbo.Evento 
            WHERE idOrganizador = @inidOrganizador 
            AND Estado != 'CANCELADO'
            AND @inFechaEvento = FechaEvento
        )
        BEGIN
            SELECT 1 AS Codigo, 'Error: Ya tienes un evento que choca con este horario (rango 1h).' AS Mensaje;
            RETURN;
        END

        -- Insertar el evento
        INSERT INTO dbo.Evento (
            idOrganizador, 
            NombreEvento, 
            Categoria, 
            FechaEvento, 
            PostTime, 
            Estado, 
            Modalidad, 
            EnlacePlenaria
        )
        VALUES (
            @inidOrganizador, 
            @inNombreEvento, 
            @inCategoria, 
            @inFechaEvento, 
            CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Central Standard Time' AS DATETIME),
            'PENDIENTE', 
            @inModalidad, 
            @inEnlacePlenaria
        );

        SELECT 0 AS Codigo, 'Evento registrado con éxito' AS Mensaje;

    END TRY
    BEGIN CATCH
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;