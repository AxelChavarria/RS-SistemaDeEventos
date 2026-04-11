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
    @inDescripcion VARCHAR(1000),
    @inidOrganizador INT,
    @inCategoria VARCHAR(45),
    @inFechaEvento DATETIME, 
    @inModalidad VARCHAR(20), 
    @inEnlacePlenaria VARCHAR(45)
    @inCupo INT
    --añadí descripcion
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
            Descripcion,
            Categoria, 
            FechaEvento, 
            PostTime, 
            Estado, 
            Modalidad, 
            EnlacePlenaria,
            Cupo
        )
        VALUES (
            @inidOrganizador, 
            @inNombreEvento, 
            @inDescripcion,
            @inCategoria, 
            @inFechaEvento, 
            CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Central Standard Time' AS DATETIME),
            'PENDIENTE', 
            @inModalidad, 
            @inEnlacePlenaria,
            @inCupo
        );

        SELECT 0 AS Codigo, 'Evento registrado con éxito' AS Mensaje;

    END TRY
    BEGIN CATCH
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;


-- Parámetros (nada)
-- Valores de retorno 
CREATE PROCEDURE sp_ConsultarEventosProximos
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        SELECT 
            idEvento,
            NombreEvento,
            Descripcion,
            Categoria,
            FechaEvento,
            Modalidad,
            EnlacePlenaria,
            Cupo,
            Estado,
            idOrganizador
        FROM Evento WHERE FechaEvento > GETDATE() 
        AND Estado != 'CANCELADO'
        ORDER BY FechaEvento ASC;
    END TRY
    BEGIN CATCH
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;


-- Parametros: id de evento y usuario
-- Retorna:
CREATE PROCEDURE sp_InscribirseAEvento
    @inIdUsuario INT,
    @inIdEvento INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FechaNuevoEvento DATETIME;
    
    BEGIN TRY

        SELECT @FechaNuevoEvento = FechaEvento 
        FROM dbo.Evento WHERE idEvento = @inIdEvento; -- fECHA DEL evento al que se desea inscribir

        -- Validar si hay cupo
        IF NOT EXISTS (SELECT 1 FROM dbo.Evento WHERE idEvento = @inIdEvento AND Cupo > 0)
        BEGIN
            SELECT 1 AS Codigo, 'Error: No hay cupos disponibles.' AS Mensaje;
            RETURN;
        END

        -- Validar que no choque con otro evento al que el usuario esté inscrito
        IF EXISTS (
            SELECT 1 
            FROM dbo.AsistentesPorEvento A
            JOIN dbo.Evento E ON A.idEvento = E.idEvento
            WHERE A.idUsuario = @inIdUsuario
            AND A.idEvento <> @inIdEvento -- Que sea un evento distinto
            AND (A.Cancelacion = 0 OR A.Cancelacion IS NULL) -- Que no esté cancelado
            AND E.FechaEvento = @FechaNuevoEvento
        )
        BEGIN
            SELECT 2 AS Codigo, 'Error: Ya tienes otro evento activo a esta misma hora.' AS Mensaje;
            RETURN;
        END

        -- Inscripcion
        BEGIN TRANSACTION
            
            -- Ya existía inscripción o cancelada
            IF EXISTS (SELECT 1 FROM dbo.AsistentesPorEvento WHERE idUsuario = @inIdUsuario AND idEvento = @inIdEvento AND Cancelacion = 1)
            BEGIN
                -- RE-INSCRIPCIÓN: Actualizamos el registro existente
                UPDATE dbo.AsistentesPorEvento
                SET Cancelacion = 0,
                    FechaInscripcion = GETDATE(),
                    FechaCancelacion = NULL
                WHERE idUsuario = @inIdUsuario AND idEvento = @inIdEvento AND Cancelacion = 1;
            END
            ELSE
            BEGIN
                -- Si es la primera vez o no hay activos
                INSERT INTO dbo.AsistentesPorEvento (idUsuario, idEvento, Asistio, FechaInscripcion, Cancelacion)
                VALUES (@inIdUsuario, @inIdEvento, 0, GETDATE(), 0);
            END

            -- SIEMPRE restamos 1 al cupo del evento
            UPDATE dbo.Evento 
            SET Cupo = Cupo - 1 
            WHERE idEvento = @inIdEvento;

        COMMIT TRANSACTION

        SELECT 0 AS Codigo, 'Inscripción procesada con éxito.' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;


CREATE PROCEDURE sp_FiLtrarEventos
    @inModalidad varchar(20),
    @inCategoria varchar(20),
    @inRango varchar(30)
AS
BEGIN
        SELECT
            idEvento,
            NombreEvento,
            Categoria,
            FechaEvento,
            Modalidad,
            EnlacePlenaria,
            Cupo,
            Estado,
            idOrganizador
        FROM Evento WHERE FechaEvento > GETDATE() AND  @inModalidad =  Modalidad AND @inCategoria = Categoria
        AND Estado != 'CANCELADO'
        ORDER BY FechaEvento ASC;
END


CREATE PROCEDURE sp_VerMisEventos
    @inIdOrganizador
AS
BEGIN
    SELECT 
        idEvento,
        NombreEvento,
        Categoria,
        FechaEvento,
        Modalidad,
        EnlacePlenaria,
        Cupo,
        Estado
        FROM Evento WHERE @inIdOrganizador = idOrganizador
END

CREATE PROCEDURE sp_ModificarEventoPendiente
    @inIdEvento INT,
    @inNombreEvento VARCHAR(60),
    @inidOrganizador INT,
    @inCategoria VARCHAR(45),
    @inFechaEvento DATETIME, 
    @inModalidad VARCHAR(20), 
    @inEnlacePlenaria VARCHAR(45)
    @inCupo INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
    END TRY

    BEGIN CATCH
    END CATCH
END