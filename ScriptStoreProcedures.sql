-- Las contraseñas se reciben como string de js


--Parámetros (correo y contraseña ambos strings)
--Valores de retorno (1; existe el correo, 0; no existe el correo)
CREATE PROCEDURE sp_IniciarSesion
    @inCorreo VARCHAR(50),
    @inContrasena VARCHAR(100), 
    @outCodigoRespuesta INT OUT   
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar si existe el correo con la contraseña asociaada
    IF EXISTS (
        SELECT 1 FROM dbo.Usuario 
        WHERE CorreoElectronico = @inCorreo 
        AND Contrasena = HASHBYTES('SHA2_512', @inContrasena)
    )
    BEGIN
        SET @outCodigoRespuesta = 1; --Entró en el if, o sea. que existe
        
        -- Retornar los datos del usuario si existe
        SELECT 
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
        SET @outCodigoRespuesta = 0; --No existe
    END
END;










-- Parámetros (nombre, apellidos, correo, contraseña y número de carnet)
-- Valores de retorno (1; ya existe el correo de parámetro, 2; ya existe el carnet de parámetro, 0; inserción exitosa)
CREATE PROCEDURE sp_RegistrarUsuario

    @inNombre VARCHAR(100),
    @inApellido VARCHAR(100),
    @inCorreo VARCHAR(50),
    @inContrasena VARCHAR(100), 
    @inCarnet VARCHAR(45),
    @outCodigo INT OUT
AS
BEGIN

SET NOCOUNT ON;

    -- 1. Verificación de existencia previa
    IF EXISTS (SELECT 1 FROM Usuario WHERE CorreoElectronico = @inCorreo)
    BEGIN
        SET @outCodigo = 1
    END

    IF EXISTS (SELECT 1 FROM Usuario WHERE Carnet = @inCarnet)
    BEGIN
        SET @outCodigo = 2
        RETURN;
    END


    BEGIN TRY
        INSERT INTO Usuario (
            NombreUsuario, 
            ApellidoUsuario, 
            CorreoElectronico, 
            Contrasena, 
            Rol, 
            Carnet, 
            FechaRegistro
        )
        VALUES (
            @inNombre, 
            @inApellido, 
            @inCorreo, 
            HASHBYTES('SHA2_512', @inContrasena), -- Encriptación
            'ASISTENTE',                       -- Rol por defecto (se cambia a organizador en otro sp)
            @inCarnet, 
            GETDATE()                          -- Fecha actual
        );
        SET @outCodigo = 0

        
    END TRY

    BEGIN CATCH
        -- Error no previsto
        SET @outCodigo = -1
    END CATCH

END;


ALTER PROCEDURE sp_RegistrarUsuario
    @inNombre VARCHAR(100),
    @inApellido VARCHAR(100),
    @inCorreo VARCHAR(50),
    @inContrasena VARCHAR(100), 
    @inCarnet VARCHAR(45)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Verificación de Correo
    IF EXISTS (SELECT 1 FROM Usuario WHERE CorreoElectronico = @inCorreo)
    BEGIN
        SELECT 1 AS Codigo, 'El correo ya existe' AS Mensaje;
        RETURN;
    END

    -- 2. Verificación de Carnet
    IF EXISTS (SELECT 1 FROM Usuario WHERE Carnet = @inCarnet)
    BEGIN
        SELECT 2 AS Codigo, 'El carnet ya existe' AS Mensaje;
        RETURN;
    END

    -- 3. Inserción
    BEGIN TRY
        INSERT INTO Usuario (NombreUsuario, ApellidoUsuario, CorreoElectronico, Contrasena, Rol, Carnet, FechaRegistro)
        VALUES (@inNombre, @inApellido, @inCorreo, HASHBYTES('SHA2_512', @inContrasena), 'ASISTENTE', @inCarnet, GETDATE());

        SELECT 0 AS Codigo, 'Usuario registrado con éxito' AS Mensaje;
    END TRY
    BEGIN CATCH
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;