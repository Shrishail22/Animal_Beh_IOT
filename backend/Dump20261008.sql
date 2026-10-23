CREATE DATABASE  IF NOT EXISTS `animaldb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `animaldb`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: animaldb
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_sessions`
--

DROP TABLE IF EXISTS `activity_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `animal_id` int unsigned NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `activity_type` enum('NORMAL_ACTIVITY','LOW_ACTIVITY','HIGH_ACTIVITY','REST','ABNORMAL') NOT NULL,
  `duration_minutes` int unsigned DEFAULT NULL,
  `average_movement` decimal(10,4) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_animal` (`animal_id`),
  KEY `idx_sessions_type` (`activity_type`),
  KEY `idx_sessions_start` (`start_time`),
  KEY `idx_sessions_animal_start` (`animal_id`,`start_time`),
  CONSTRAINT `fk_activity_sessions_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_sessions`
--

LOCK TABLES `activity_sessions` WRITE;
/*!40000 ALTER TABLE `activity_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alerts`
--

DROP TABLE IF EXISTS `alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alerts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `animal_id` int unsigned NOT NULL,
  `prediction_id` bigint unsigned DEFAULT NULL,
  `alert_type` enum('LOW_ACTIVITY','HIGH_ACTIVITY','ABNORMAL_BEHAVIOR','HIGH_TEMPERATURE','LOW_TEMPERATURE','DEVICE_OFFLINE') NOT NULL,
  `severity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `message` varchar(500) NOT NULL,
  `status` enum('OPEN','ACKNOWLEDGED','RESOLVED') NOT NULL DEFAULT 'OPEN',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_alerts_animal` (`animal_id`),
  KEY `idx_alerts_prediction` (`prediction_id`),
  KEY `idx_alerts_type` (`alert_type`),
  KEY `idx_alerts_severity` (`severity`),
  KEY `idx_alerts_status` (`status`),
  KEY `idx_alerts_created_at` (`created_at`),
  KEY `idx_alerts_animal_status` (`animal_id`,`status`),
  CONSTRAINT `fk_alerts_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_alerts_prediction` FOREIGN KEY (`prediction_id`) REFERENCES `behavioral_predictions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alerts`
--

LOCK TABLES `alerts` WRITE;
/*!40000 ALTER TABLE `alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `animals`
--

DROP TABLE IF EXISTS `animals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `animals` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `animal_code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `species` varchar(100) NOT NULL,
  `breed` varchar(100) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `date_of_birth` date DEFAULT NULL,
  `weight_kg` decimal(6,2) DEFAULT NULL,
  `owner_name` varchar(150) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','REMOVED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `animal_code` (`animal_code`),
  KEY `idx_animals_species` (`species`),
  KEY `idx_animals_breed` (`breed`),
  KEY `idx_animals_status` (`status`),
  KEY `idx_animals_owner` (`owner_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `animals`
--

LOCK TABLES `animals` WRITE;
/*!40000 ALTER TABLE `animals` DISABLE KEYS */;
/*!40000 ALTER TABLE `animals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `behavioral_predictions`
--

DROP TABLE IF EXISTS `behavioral_predictions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `behavioral_predictions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `animal_id` int unsigned NOT NULL,
  `reading_id` bigint unsigned NOT NULL,
  `predicted_behavior` enum('NORMAL','LOW_ACTIVITY','HIGH_ACTIVITY','ABNORMAL') NOT NULL,
  `confidence` decimal(5,4) NOT NULL,
  `risk_level` enum('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'LOW',
  `model_version` varchar(50) NOT NULL DEFAULT 'RF_v1',
  `predicted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_predictions_animal` (`animal_id`),
  KEY `idx_predictions_reading` (`reading_id`),
  KEY `idx_predictions_behavior` (`predicted_behavior`),
  KEY `idx_predictions_risk` (`risk_level`),
  KEY `idx_predictions_time` (`predicted_at`),
  KEY `idx_predictions_animal_time` (`animal_id`,`predicted_at`),
  CONSTRAINT `fk_predictions_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_predictions_reading` FOREIGN KEY (`reading_id`) REFERENCES `sensor_readings` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `behavioral_predictions`
--

LOCK TABLES `behavioral_predictions` WRITE;
/*!40000 ALTER TABLE `behavioral_predictions` DISABLE KEYS */;
/*!40000 ALTER TABLE `behavioral_predictions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `device_code` varchar(50) NOT NULL,
  `animal_id` int unsigned NOT NULL,
  `device_type` varchar(100) NOT NULL DEFAULT 'ESP32',
  `firmware_version` varchar(50) DEFAULT NULL,
  `battery_level` decimal(5,2) DEFAULT NULL,
  `status` enum('ONLINE','OFFLINE','MAINTENANCE') NOT NULL DEFAULT 'OFFLINE',
  `last_seen` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_code` (`device_code`),
  KEY `idx_devices_animal_id` (`animal_id`),
  KEY `idx_devices_status` (`status`),
  KEY `idx_devices_last_seen` (`last_seen`),
  CONSTRAINT `fk_devices_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devices`
--

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sensor_readings`
--

DROP TABLE IF EXISTS `sensor_readings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sensor_readings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `device_id` int unsigned NOT NULL,
  `animal_id` int unsigned NOT NULL,
  `movement` decimal(10,4) NOT NULL DEFAULT '0.0000',
  `temperature` decimal(5,2) DEFAULT NULL,
  `activity_duration` int unsigned NOT NULL DEFAULT '0',
  `rest_duration` int unsigned NOT NULL DEFAULT '0',
  `activity_frequency` int unsigned NOT NULL DEFAULT '0',
  `recorded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sensor_device` (`device_id`),
  KEY `idx_sensor_animal` (`animal_id`),
  KEY `idx_sensor_recorded_at` (`recorded_at`),
  KEY `idx_sensor_animal_time` (`animal_id`,`recorded_at`),
  CONSTRAINT `fk_sensor_readings_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sensor_readings_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sensor_readings`
--

LOCK TABLES `sensor_readings` WRITE;
/*!40000 ALTER TABLE `sensor_readings` DISABLE KEYS */;
/*!40000 ALTER TABLE `sensor_readings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','RESEARCHER','VIEWER') DEFAULT 'VIEWER',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'animaldb'
--

--
-- Dumping routines for database 'animaldb'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-08 17:30:27
