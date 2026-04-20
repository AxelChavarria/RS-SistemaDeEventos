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

        SELECT 1 AS Codigo, 'Evento actualizado directamente' AS Mensaje;
    END

    ELSE IF @estadoActual = 'APROBADO'
    BEGIN
        INSERT INTO SolicitudesPorEvento (
            idAdministrador, 
            idEventoReal, 
            NombreSolicitud, 
            TipoSolicitud, 
            Resolucion,
            NuevoNombre,
            NuevaDescripcion,
            NuevaCategoria,
            NuevaFecha,
            NuevaModalidad,
            NuevoEnlace,
            NuevoCupo
        )
        VALUES (
            @idAdmin, 
            @inIdEvento, 
            CONCAT('Cambio propuesto para: ', @inNombre), 
            'Modificacion', 
            'PENDIENTE',
            @inNombre,
            @inDescripcion,
            @inCategoria,
            @inFecha,
            @inModalidad,
            @inEnlace,
            @inCupo
        );

        SELECT 2 AS Codigo, 'Solicitud de modificación creada con éxito' AS Mensaje;
    END
    ELSE
    BEGIN
        SELECT 0 AS Codigo, 'No se puede modificar un evento' AS Mensaje;
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


-- Parámetro(nada)
ALTER PROCEDURE sp_ConsultarSolicitudesPendientes
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @inIdAdmin INT
    SET @idIdAdmin = 11;

        S.*, 
        U_Org.NombreUsuario AS NombreOrganizador,
        E.NombreEvento AS NombreActualEvento -- 
    FROM SolicitudesPorEvento S
    INNER JOIN Evento E ON S.idEventoReal = E.idEvento
    INNER JOIN Usuario U_Org ON E.idOrganizador = U_Org.idUsuario
    WHERE S.idAdministrador = @inIdAdmin 
      AND S.TipoSolicitud = 'Modificacion' 
      AND S.Resolucion = 'PENDIENTE';

 
    SELECT 
        S.*, 
        U_Org.NombreUsuario AS NombreOrganizador,
        E.NombreEvento AS NombreActualEvento
    FROM SolicitudesPorEvento S
    INNER JOIN Evento E ON S.idEventoReal = E.idEvento
    INNER JOIN Usuario U_Org ON E.idOrganizador = U_Org.idUsuario
    WHERE S.idAdministrador = @inIdAdmin 
      AND S.TipoSolicitud = 'Cancelacion' 
      AND S.Resolucion = 'PENDIENTE';
END;


-- Parámetro (id de la solicitud)
-- Retorno (1: exito, -1: error)
CREATE PROCEDURE sp_AprobarModificacion
    @inIdSolicitud INT,
    @inIdAdmin INT
AS
BEGIN
    SET NOCOUNT ON;
    SET @inIdAdmin = 11
    BEGIN TRY
        BEGIN TRANSACTION;
      
        UPDATE E
        SET E.NombreEvento = S.NuevoNombre,
            E.Descripcion = S.NuevaDescripcion,
            E.Categoria = S.NuevaCategoria,
            E.FechaEvento = S.NuevaFecha,
            E.Modalidad = S.NuevaModalidad,
            E.EnlacePlenaria = S.NuevoEnlace,
            E.Cupo = S.NuevoCupo
        FROM Evento E
        INNER JOIN SolicitudesPorEvento S ON E.idEvento = S.idEventoReal
        WHERE S.idEvento = @inIdSolicitud AND S.idAdministrador = @inIdAdmin;

        -- solicitud como aprobada
        UPDATE SolicitudesPorEvento 
        SET Resolucion = 'APROBADO', FechaResolucion = GETDATE()
        WHERE idSolicitud = @inIdSolicitud;

        COMMIT TRANSACTION;
        SELECT 1 AS Codigo, 'Modificación aplicada con éxito' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;


-- Parámetro (id de la solicitud)
-- Retorno (1: exito)
CREATE PROCEDURE sp_RechazarModificacion
    @inIdSolicitud INT
AS
BEGIN
    UPDATE SolicitudesPorEvento 
    SET Resolucion = 'RECHAZADO', FechaResolucion = GETDATE()
    WHERE idSolicitud = @inIdSolicitud;
    
    SELECT 1 AS Codigo, 'Solicitud de modificación rechazada' AS Mensaje;
END;




-- Parámetro (id de la solicitud)
-- Retorno (1: exito, -1: error)
CREATE PROCEDURE sp_AprobarCancelacion
    @inIdSolicitud INT,
    @inIdAdmin INT
AS
BEGIN
    SET NOCOUNT ON;
    SET @inIdAdmin = 11;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        UPDATE E SET E.Estado = 'CANCELADO'
        FROM Evento E
        INNER JOIN SolicitudesPorEvento S ON E.idEvento = S.idEventoReal
        WHERE S.idSolicitud = @inIdSolicitud AND S.idAdministrador = @inIdAdmin;

        -- Marcar solicitud como aprobada
        UPDATE SolicitudesPorEvento 
        SET Resolucion = 'APROBADO', FechaResolucion = GETDATE()
        WHERE idSolicitud = @inIdSolicitud;

        COMMIT TRANSACTION;
        SELECT 1 AS Codigo, 'Evento cancelado oficialmente' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;


-- Parámetro (id de la solicitud)
-- Retorno (1: exito)
CREATE PROCEDURE sp_RechazarCancelacion
    @inIdSolicitud INT
AS
BEGIN
    UPDATE SolicitudesPorEvento 
    SET Resolucion = 'RECHAZADO', FechaResolucion = GETDATE()
    WHERE idSolicitud = @inIdSolicitud;

    SELECT 1 AS Codigo, 'Solicitud de cancelación rechazada' AS Mensaje;
END;


-- Parámetro (id de la solicitud)
-- Retorno (1: exito)
CREATE PROCEDURE sp_VerMisInscripcionesPasadas
    @inIdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        E.idEvento,
        E.NombreEvento,
        E.Descripcion,
        E.FechaEvento,
        E.Modalidad,
        E.Categoria,
        U.NombreUsuario AS NombreOrganizador, 
        A.FechaInscripcion,
        A.Asistio,
        A.idAsitenciaEvento
    FROM AsistentesPorEvento A
    INNER JOIN Evento E ON A.idEvento = E.idEvento
    INNER JOIN Usuario U ON E.idOrganizador = U.idUsuario 
    WHERE A.idUsuario = @inIdUsuario 
      AND E.FechaEvento < GETDATE()
      AND (A.Cancelacion = 0 OR A.Cancelacion IS NULL)
    ORDER BY E.FechaEvento DESC;
END;



-- Parámetro (id de la solicitud)
-- Retorno (1: exito)
CREATE PROCEDURE sp_VerMisInscripcionesFuturas
    @inIdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        E.idEvento,
        E.NombreEvento,
        E.Descripcion,
        E.FechaEvento,
        E.Modalidad,
        E.EnlacePlenaria,
        U.NombreUsuario AS NombreOrganizador, 
        A.FechaInscripcion,
        A.idAsitenciaEvento
    FROM AsistentesPorEvento A
    INNER JOIN Evento E ON A.idEvento = E.idEvento
    INNER JOIN Usuario U ON E.idOrganizador = U.idUsuario -
    WHERE A.idUsuario = @inIdUsuario 
      AND E.FechaEvento >= GETDATE()
      AND (A.Cancelacion = 0 OR A.Cancelacion IS NULL)
    ORDER BY E.FechaEvento ASC;
END;

--recibe nada
-- retorna exito
CREATE PROCEDURE sp_CrearAnuncio
    @inMensaje VARCHAR(1500)
AS
BEGIN
    DECLARE @idAdmin INT = 11;

    INSERT INTO Notificacion(Mensaje,FechaEnvio, idUsuario) VALUES(@inMensaje, GETDATE(), @idAdmin)
    SELECT 0 as Codigo, 'Anuncio creado'

END


-- Recibe (nada)
-- Retorna (los 3 notificaciones mas recientes)
CREATE PROCEDURE sp_VerAnuncios
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 3 Mensaje, FechaEnvio, idUsuario 
    FROM Notificacion 
    ORDER BY FechaEnvio DESC;
END





-- Recibe (estado)
-- Retorna (lista de TODOS los eventos en ese estado)
CREATE PROCEDURE sp_VerTodosLosEventos
    @inEstado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        SELECT 
            E.idEvento,
            E.NombreEvento,
            E.Descripcion,
            E.FechaEvento,
            E.Modalidad,
            E.Categoria,
            E.Cupo,
            E.EnlacePlenaria,
            U.NombreUsuario AS NombreOrganizador
        FROM Evento E 
        INNER JOIN Usuario U ON E.idOrganizador = U.idUsuario 
        WHERE E.Estado = @inEstado 
        ORDER BY E.FechaEvento ASC;
    END TRY
    BEGIN CATCH
        SELECT ERROR_MESSAGE() AS MensajeError;
    END CATCH
END;


-- Recibe id de usuario y evento
-- Retorna código y mensaje
CREATE PROCEDURE sp_DesinscribirEvento
    @inIdEvento INT,
    @inIdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Verificar si la inscripción existe y no está ya cancelada
        IF NOT EXISTS (SELECT 1 FROM AsistentesPorEvento 
                       WHERE idEvento = @inIdEvento AND idUsuario = @inIdUsuario AND (Cancelacion = 0 OR Cancelacion IS NULL))
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Codigo, 'No tienes una inscripción activa para este evento' AS Mensaje;
            RETURN;
        END

        -- 2. Marcar como cancelado y registrar la fecha
        UPDATE AsistentesPorEvento 
        SET Cancelacion = 1, 
            FechaCancelacion = GETDATE()
        WHERE idEvento = @inIdEvento AND idUsuario = @inIdUsuario;

        --Devolver el cupo al evento (+1)
        UPDATE Evento 
        SET Cupo = Cupo + 1 
        WHERE idEvento = @inIdEvento;

        COMMIT TRANSACTION;
        SELECT 1 AS Codigo, 'Inscripción cancelada con éxito. El cupo ha sido liberado.' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT -1 AS Codigo, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;


-- Recibe id de evento 
-- retorna codigo y mensaje
CREATE PROCEDURE sp_AprobarRechazarEvento
    @inAccion Varchar(25),
    @inIdEvento INT
AS
BEGIN
    SET NOCOUNT ON;
    IF @inAccion = 'Aprobar';
    BEGIN
        UPDATE Evento
        SET Estado = 'APROBADO'
        WHERE idEvento = @inIdEvento;
        SELECT 0 as Codigo, "Evento aprobado" as Mensaje
    END

    IF @inAccion = 'Rechazar';
    BEGIN
        UPDATE Evento
        SET Estado = 'CANCELADO'
        WHERE idEvento = @inIdEvento;
        SELECT 1 as Codigo, "Evento cancelado" as Mensaje
    END
END


-- Recibe id de evento 
-- retorna usuarios y asistencia
CREATE PROCEDURE sp_MostrarAsistentesEvento
    @inIdEvento INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT U.NombreUsuario, U.CorreoElectronico, U.Carnet, A.Asistio, A.FechaInscripcion FROM Usuario U 
    INNER JOIN AsistentesPorEvento A ON U.idUsuario = A.idUsuario 
    WHERE @inIdEvento = A.idEvento
    AND (A.Cancelacion = 0 OR A.Cancelacion IS NULL);
END



-- recibe nada
-- retorna a todos los usuarios
CREATE PROCEDURE sp_MostrarUsuarios
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        U.NombreUsuario, 
        U.CorreoElectronico, 
        U.Rol
        COUNT(E.idEvento) AS EventosRealizados
    FROM Usuario U
    LEFT JOIN Evento E ON U.idUsuario = E.idOrganizador AND E.Estado = 'APROBADO'
    GROUP BY U.NombreUsuario, U.CorreoElectronico, U.Rol
    ORDER BY EventosRealizados DESC;
END;


-- recibe el correo y la acción
-- retorna el código y mensaje
CREATE PROCEDURE sp_GestionarOrganizadores
    @inCorreo
    @inAccion
AS
BEGIN
    SET NOCOUNT ON;

    IF @inAccion ='Activar'
    BEGIN
        UPDATE Usuario
        SET Rol = 'ORGANIZADOR'
        WHERE CorreElectronico = @inCorreo
        SELECT 0 AS Codigo, 'Usuario ascendido a ORGANIZADOR' AS Mensaje;
    END

    IF @inAccion ='Desactivar'
    BEGIN
        UPDATE Usuario
        SET Rol = 'ASISTENTE'
        WHERE CorreoElectronico = @inCorreo 
        SELECT 1 AS Codigo, 'Usuario degradado a Asistente' AS Mensaje;
    END
END


--recibe el id del evento, carnet del usuario y accion
-- retorna código y mensaje
CREATE PROCEDURE sp_MarcarAsistencia
    @inCarnet VARCHAR(45),
    @inIdEvento INT,
    @inAccion VARCHAR(20) 
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @idUsuario INT;

    -- 1. Obtener el idUsuario a partir del carnet
    SELECT @idUsuario = idUsuario FROM Usuario WHERE Carnet = @inCarnet;


    IF @inAccion = 'Presente'
    BEGIN
        UPDATE AsistentesPorEvento
        SET Asistio = 1
        WHERE idEvento = @inIdEvento AND idUsuario = @idUsuario;
        
        SELECT 1 AS Codigo, 'Asistencia marcada como Presente' AS Mensaje;
    END


    ELSE IF @inAccion = 'Ausente'
    BEGIN
        UPDATE AsistentesPorEvento
        SET Asistio = 0
        WHERE idEvento = @inIdEvento AND idUsuario = @idUsuario;
        
        SELECT 1 AS Codigo, 'Asistencia marcada como Ausente' AS Mensaje;
    END
END;

CREATE PROCEDURE sp_ObtenerCorreosAsistentes
    @inIdEvento INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        U.CorreoElectronico
    FROM Usuario U
    INNER JOIN AsistentesPorEvento A ON U.idUsuario = A.idUsuario
    WHERE A.idEvento = @inIdEvento 
      AND (A.Cancelacion = 0 OR A.Cancelacion IS NULL);
END;





CREATE PROCEDURE sp_ObtenerCorreoOrganizador
    @inIdEvento INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT U.CorreoElectronico FROM Usuario U INNER JOIN Evento E ON U.idUsuario = E.idOrganizador WHERE E.idEvento = @inIdEvento
END




CREATE PROCEDURE sp_ObtenerCorreosAsistentes
    @inIdEvento INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        U.CorreoElectronico
    FROM Usuario U
    INNER JOIN AsistentesPorEvento A ON U.idUsuario = A.idUsuario
    WHERE A.idEvento = @inIdEvento 
      AND (A.Cancelacion = 0 OR A.Cancelacion IS NULL);
END;

CREATE PROCEDURE sp_ReporteDeEventos





CREATE PROCEDURE sp_ModeracionCancelar
    @inIdEvento INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Evento
    SET Estado = 'CANCELADO'
    WHERE idEvento = @inIdEvento
    SELECT 0 as Código, 'Evento cancelado' as Mensaje
END

ALTER PROCEDURE sp_ModeracionEditar
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
    
        UPDATE Evento SET
            NombreEvento = @inNombre,
            Descripcion = @inDescripcion,
            Categoria = @inCategoria,
            FechaEvento = @inFecha,
            Modalidad = @inModalidad,
            EnlacePlenaria = @inEnlace,
            Cupo = @inCupo
        WHERE idEvento = @inIdEvento;

        SELECT 1 AS Codigo, 'Evento actualizado' AS Mensaje;
  
END;

CREATE PROCEDURE sp_ColocarJustificacion
    @inIdEvento INT;
    @inJustificacion VARCHAR(1000)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Evento
    SET JustificacionRechazo = @inJustificacion
    WHERE idEvento = @inIdEvento
END



CREATE PROCEDURE sp_GenerarReporteEventos
    @inFechaInicio DATETIME,
    @inFechaFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        E.idEvento,
        E.NombreEvento,
        E.Categoria,
        E.FechaEvento,
        E.Cupo,
        ISNULL(COUNT(A.idUsuario), 0) AS TotalAsistentes,
        CASE 
            WHEN E.Cupo > 0 THEN (CAST(ISNULL(COUNT(A.idUsuario), 0) AS FLOAT) / E.Cupo) * 100 
            ELSE 0 
        END AS PorcentajeOcupacion
    FROM Evento E
    LEFT JOIN Asistencia A ON E.idEvento = A.idEvento
    WHERE E.FechaEvento BETWEEN @inFechaInicio AND @inFechaFin
      AND E.Estado = 'APROBADO'
    GROUP BY E.idEvento, E.NombreEvento, E.Categoria, E.FechaEvento, E.Cupo;

    -- Estadísticas Generales 
    SELECT 
        COUNT(idEvento) AS TotalEventosRealizados,
        AVG(CAST(AsistentesPorEvento.Cuenta AS FLOAT)) AS PromedioAsistentesGeneral
    FROM (
        SELECT COUNT(A.idUsuario) AS Cuenta
        FROM Evento E
        LEFT JOIN Asistencia A ON E.idEvento = A.idEvento
        WHERE E.FechaEvento BETWEEN @inFechaInicio AND @inFechaFin
        GROUP BY E.idEvento
    ) AS AsistentesPorEvento;
END;




CREATE PROCEDURE sp_ActualizarPerfilUsuario
    @inIdUsuario INT,
    @inEnlace VARCHAR(1000),
    @inBio VARCHAR(1000)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Usuario 
    SET Enlace = @inEnlace, 
        Bio = @inBio
    WHERE idUsuario = @inIdUsuario;
    
    SELECT 0 AS Codigo, 'Perfil actualizado correctamente' AS Mensaje;
END;