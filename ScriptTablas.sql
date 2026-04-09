USE PY02BDDIS2026;
GO

-- -----------------------------------------------------
-- Table Usuario
-- -----------------------------------------------------
CREATE TABLE Usuario (
  idUsuario INT NOT NULL IDENTITY(1,1),
  NombreUsuario VARCHAR(100) NULL,
  ApellidoUsuario VARCHAR(100) NULL,
  CorreoElectronico VARCHAR(50) NOT NULL,
  Contrasena VARBINARY(64) NOT NULL, 
  Rol VARCHAR(20) NOT NULL,
  Carnet VARCHAR(45) NOT NULL,
  FechaRegistro DATETIME NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_Usuario PRIMARY KEY (idUsuario),
  CONSTRAINT UQ_Usuario_Correo UNIQUE (CorreoElectronico),
  CONSTRAINT UQ_Usuario_Carnet UNIQUE (Carnet),
  CONSTRAINT CHK_Rol CHECK (Rol IN ('ADMINISTRADOR', 'ASISTENTE', 'ORGANIZADOR'))
);

-- -----------------------------------------------------
-- Table Evento
-- -----------------------------------------------------
CREATE TABLE Evento (
  idOrganizador INT NOT NULL,
  idEvento INT NOT NULL IDENTITY(1,1),
  NombreEvento VARCHAR(60) NULL,
  Categoria VARCHAR(45) NULL,
  FechaEvento DATETIME NULL,
  PostTime VARCHAR(45) NULL,
  Estado VARCHAR(20) NULL,
  Modalidad VARCHAR(20) NULL,
  JustificacionRechazo VARCHAR(45) NULL,
  EnlacePlenaria VARCHAR(45) NULL,
  CONSTRAINT PK_Evento PRIMARY KEY (idEvento),
  CONSTRAINT FK_Evento_Usuario FOREIGN KEY (idOrganizador) REFERENCES Usuario (idUsuario),
  CONSTRAINT CHK_Estado CHECK (Estado IN ('PENDIENTE', 'APROBADO', 'CANCELADO')),
  CONSTRAINT CHK_Modalidad CHECK (Modalidad IN ('VIRTUAL', 'PRESENCIAL', 'HIBRIDA'))
);
ALTER TABLE Evento 
ADD Cupo INT NOT NULL DEFAULT 10;



-- -----------------------------------------------------
-- Table SolicitudesPorEvento
-- -----------------------------------------------------
CREATE TABLE SolicitudesPorEvento (
  idAdministrador INT NOT NULL,
  idEvento INT NOT NULL IDENTITY(1,1),
  NombreSolicitud VARCHAR(45) NULL,
  Resolucion VARCHAR(20) NULL,
  FechaResolucion DATETIME NULL,
  CONSTRAINT PK_Solicitudes PRIMARY KEY (idAdministrador, idEvento),
  CONSTRAINT FK_Solicitudes_Admin FOREIGN KEY (idAdministrador) REFERENCES Usuario (idUsuario),
  CONSTRAINT FK_Solicitudes_Evento FOREIGN KEY (idEvento) REFERENCES Evento (idEvento),
  CONSTRAINT CHK_Resolucion CHECK (Resolucion IN ('APROBADO', 'RECHAZADO', 'NEGADODEFAULT'))
);

-- -----------------------------------------------------
-- Table AsistentesPorEvento
-- -----------------------------------------------------
CREATE TABLE AsistentesPorEvento (
  idAsitenciaEvento INT NOT NULL IDENTITY(1,1),
  idUsuario INT NOT NULL,
  idEvento INT NOT NULL,
  Asistio BIT NULL, -- TINYINT a BIT
  FechaInscripcion DATETIME NULL,
  FechaCancelacion DATETIME NULL,
  Cancelacion BIT NULL,
  CONSTRAINT PK_Asistentes PRIMARY KEY (idUsuario, idEvento, idAsitenciaEvento),
  CONSTRAINT FK_Asistentes_Usuario FOREIGN KEY (idUsuario) REFERENCES Usuario (idUsuario),
  CONSTRAINT FK_Asistentes_Evento FOREIGN KEY (idEvento) REFERENCES Evento (idEvento)
);

-- -----------------------------------------------------
-- Table RegistroAuditoría
-- -----------------------------------------------------
CREATE TABLE RegistroAuditoria (
  idAuditoría INT NOT NULL IDENTITY(1,1),
  idAdministrador INT NOT NULL,
  NombreTablaAfectada VARCHAR(45) NULL,
  idRegistroAfectado VARCHAR(45) NULL,
  ValorAnterior VARCHAR(MAX) NULL, --
  ValorNuevo VARCHAR(MAX) NULL,
  Fecha DATETIME NULL DEFAULT GETDATE(),
  CONSTRAINT PK_Auditoria PRIMARY KEY (idAuditoría),
  CONSTRAINT FK_Auditoria_Usuario FOREIGN KEY (idAdministrador) REFERENCES Usuario (idUsuario)
);

-- -----------------------------------------------------
-- Table Correo
-- -----------------------------------------------------
CREATE TABLE Correo (
  idCorreo INT NOT NULL IDENTITY(1,1),
  Mensaje VARCHAR(1500) NULL,
  FechaEnvio DATETIME NULL,
  idEvento INT NOT NULL,
  CONSTRAINT PK_Correo PRIMARY KEY (idCorreo),
  CONSTRAINT FK_Correo_Evento FOREIGN KEY (idEvento) REFERENCES Evento (idEvento)
);

-- -----------------------------------------------------
-- Table Notificacion
-- -----------------------------------------------------
CREATE TABLE Notificacion (
  idNotificacion INT NOT NULL IDENTITY(1,1),
  Mensaje VARCHAR(1500) NULL,
  FechaEnvio DATETIME NULL,
  idUsuario INT NOT NULL,
  CONSTRAINT PK_Notificacion PRIMARY KEY (idNotificacion),
  CONSTRAINT FK_Notificacion_Usuario FOREIGN KEY (idUsuario) REFERENCES Usuario (idUsuario)
);
GO