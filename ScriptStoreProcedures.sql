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
        AND Estado = 'APROBADO'
        ORDER BY FechaEvento ASC;
    END TRY
    BEGIN CATCH
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;


-- Parametros: id de evento y usuario
-- Retorna: 0 si ya está inscrito, 1 si se reactivó la inscripción, 2 si  no hay cupo
CREATE PROCEDURE sp_InscribirEvento
    @inIdEvento INT,
    @inIdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Verificar si el evento existe y tiene cupo disponible
        DECLARE @cupoActual INT;
        SELECT @cupoActual = Cupo FROM Evento WHERE idEvento = @inIdEvento;

        IF @cupoActual <= 0
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 2 AS Codigo, 'No hay cupo disponible para este evento' AS Mensaje;
            RETURN;
        END

        --Verificar inscripcion
        IF EXISTS (SELECT 1 FROM AsistentesPorEvento WHERE idEvento = @inIdEvento AND idUsuario = @inIdUsuario)
        BEGIN
            -- Si existe pero estaba cancelada, se reactiva
            IF EXISTS (SELECT 1 FROM AsistentesPorEvento WHERE idEvento = @inIdEvento AND idUsuario = @inIdUsuario AND Cancelacion = 1)
            BEGIN
                UPDATE AsistentesPorEvento 
                SET Cancelacion = 0, FechaInscripcion = GETDATE(), FechaCancelacion = NULL
                WHERE idEvento = @inIdEvento AND idUsuario = @inIdUsuario;
                
                -- Restar 1 al cupo
                UPDATE Evento SET Cupo = Cupo - 1 WHERE idEvento = @inIdEvento;

                COMMIT TRANSACTION;
                SELECT 1 AS Codigo, 'Inscripción reactivada con éxito' AS Mensaje;
                RETURN;
            END
            ELSE
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT 0 AS Codigo, 'Ya te encuentras inscrito en este evento' AS Mensaje;
                RETURN;
            END
        END

        -- Registrar
        INSERT INTO AsistentesPorEvento (idUsuario, idEvento, Asistio, FechaInscripcion, Cancelacion)
        VALUES (@inIdUsuario, @inIdEvento, 0, GETDATE(), 0);

        -- Restar 1 al cupo en la tabla Evento
        UPDATE Evento SET Cupo = Cupo - 1 WHERE idEvento = @inIdEvento;

        COMMIT TRANSACTION;
        SELECT 1 AS Codigo, 'Inscripción realizada con éxito' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;


CREATE PROCEDURE sp_FiltrarEventos
    @inModalidad VARCHAR(20),
    @inCategoria VARCHAR(20),
    @inRango VARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        E.idEvento,
        E.NombreEvento,
        E.Descripcion,       -- Nueva columna agregada
        E.Categoria,
        E.FechaEvento,
        E.Modalidad,
        E.EnlacePlenaria,
        E.Cupo,
        E.Estado,
        E.idOrganizador,
        U.NombreUsuario AS Nombre -- Nombre desde la tabla Usuario
    FROM Evento E
    INNER JOIN Usuario U ON E.idOrganizador = U.idUsuario
    WHERE 
        E.FechaEvento > GETDATE() 
        AND E.Estado != 'CANCELADO'
        AND (@inModalidad = 'TODOS' OR E.Modalidad = @inModalidad)
        AND (@inCategoria = 'TODOS' OR E.Categoria = @inCategoria)
        AND (
            (@inRango = 'Próximos') 
            OR (@inRango = 'Semanal' AND 
                E.FechaEvento >= DATEADD(DAY, 1 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE)) AND 
                E.FechaEvento <= DATEADD(DAY, 7 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE)))
            OR (@inRango = 'Mensuales' AND 
                MONTH(E.FechaEvento) = MONTH(GETDATE()) AND 
                YEAR(E.FechaEvento) = YEAR(GETDATE()))
        )
    ORDER BY E.FechaEvento ASC;
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

CREATE PROCEDURE sp_ConsultarInscripcionesPasadas
    @inIdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        E.idEvento,
        E.NombreEvento,
        E.Descripcion,
        E.Categoria,
        E.FechaEvento,
        E.Modalidad,
        E.EnlacePlenaria,
        E.Cupo,
        E.Estado,
        E.idOrganizador,
        U_Org.NombreUsuario AS NombreOrganizador
    FROM AsistentesPorEvento A
    INNER JOIN Evento E ON A.idEvento = E.idEvento
    INNER JOIN Usuario U_Org ON E.idOrganizador = U_Org.idUsuario
    WHERE A.idUsuario = @inIdUsuario 
      AND A.Cancelacion = 0
      AND E.FechaEvento < GETDATE()
    ORDER BY E.FechaEvento DESC; --Recientes primero
END;

-- Parámetros (datos de evento)
-- Ret (1; Pendiente modificado, 2; solicitud echa, 0; no se pudo)
ALTER PROCEDURE sp_ModificarEvento
    @inIdEvento INT,
    @inNombre VARCHAR(60),
    @inDescripcion VARCHAR(1000),
    @inCategoria VARCHAR(45),
    @inFecha DATETIME,
    @inModalidad VARCHAR(20),
    @inEnlace VARCHAR(45),
    @inCupo INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @estadoActual VARCHAR(20);
    DECLARE @idAdmin INT;
    SET @idAdmin = 11;

    SELECT @estadoActual = Estado FROM Evento WHERE idEvento = @inIdEvento;


    IF @estadoActual = 'PENDIENTE'
    BEGIN
        UPDATE Evento SET
            NombreEvento = @inNombre,
            Descripcion = @inDescripcion,
            Categoria = @inCategoria,
            FechaEvento = @inFecha,
            Modalidad = @inModalidad,
            EnlacePlenaria = @inEnlace,
            Cupo = @inCupo
        WHERE idEvento = @inIdEvento;

        SELECT 1 AS Codigo, 'Evento modificado directamente por estar PENDIENTE' AS Mensaje;
    END

    ELSE IF @estadoActual = 'APROBADO'
    BEGIN

        DECLARE @resumenCambios VARCHAR(MAX);
        SET @resumenCambios = CONCAT(
            'Nuevo Nombre: ', @inNombre, 
            ' | Fecha: ', CONVERT(VARCHAR, @inFecha, 120), 
            ' | Modalidad: ', @inModalidad, 
            ' | Cupo: ', @inCupo,
            ' | Desc: ', LEFT(@inDescripcion, 50), '...'
        );


        INSERT INTO SolicitudesPorEvento (
            idAdministrador, 
            idEventoReal, 
            NombreSolicitud, 
            TipoSolicitud,
            Resolucion
        )
        VALUES (
            @idAdmin, 
            @inIdEvento, 
            @resumenCambios, 
            'Modificacion', 
            'PENDIENTE'
        );

        SELECT 2 AS Codigo, 'El evento ya estaba aprobado. Se envió solicitud de modificación.' AS Mensaje;
    END
    ELSE
    BEGIN
        SELECT 0 AS Codigo, 'No se puede modificar un evento cancelado.' AS Mensaje;
    END
END;


-- Parámetro (id del evento)
-- Ret (1 si se canceló pendiente, 2 si se hizo solicitud, 3, ya existe solicitud, 0 error)
CREATE PROCEDURE sp_CancelarEvento
    @inIdEvento INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @estadoActual VARCHAR(20);
    DECLARE @idAdmin INT;
    SET @idAdmin = 11;
    DECLARE @nombreEvento VARCHAR(60);

    SELECT @estadoActual = Estado, @nombreEvento = NombreEvento 
    FROM Evento WHERE idEvento = @inIdEvento;
    


    IF @estadoActual = 'PENDIENTE'
    BEGIN
        UPDATE Evento SET Estado = 'CANCELADO' WHERE idEvento = @inIdEvento;
        SELECT 1 AS Codigo, 'Evento pendiente cancelado exitosamente.' AS Mensaje;
    END

 
    ELSE IF @estadoActual = 'APROBADO'
    BEGIN
        IF EXISTS (SELECT 1 FROM SolicitudesPorEvento 
                   WHERE idEventoReal = @inIdEvento 
                   AND TipoSolicitud = 'Cancelacion' 
                   AND Resolucion = 'PENDIENTE')
        BEGIN
            SELECT 3 AS Codigo, 'Ya existe una solicitud de cancelación en espera.' AS Mensaje;
            RETURN;
        END

        INSERT INTO SolicitudesPorEvento (
            idAdministrador, 
            idEventoReal, 
            NombreSolicitud, 
            TipoSolicitud,
            Resolucion
        )
        VALUES (
            @idAdmin, 
            @inIdEvento, 
            CONCAT('Solicitud para cancelar: ', @nombreEvento), 
            'Cancelacion', 
            'PENDIENTE'
        );

        SELECT 2 AS Codigo, 'Se envió la solicitud de cancelación al administrador.' AS Mensaje;
    END
    ELSE
    BEGIN
        SELECT 0 AS Codigo, 'El evento no puede ser cancelado en su estado actual.' AS Mensaje;
    END
END;