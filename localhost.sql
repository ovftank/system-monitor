-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost:3306
-- Thời gian đã tạo: Th12 27, 2025 lúc 12:26 AM
-- Phiên bản máy phục vụ: 10.11.14-MariaDB-cll-lve
-- Phiên bản PHP: 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `sppcvnfh_tool`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `hwid` varchar(100) DEFAULT NULL,
  `status` tinyint(4) NOT NULL,
  `license_expire` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_vietnamese_ci;

--
-- Đang đổ dữ liệu cho bảng `accounts`
--

INSERT INTO `accounts` (`id`, `username`, `password`, `hwid`, `status`, `license_expire`) VALUES
(10, 'superpc', '281087', '498FDFCA-BDE8-2885-3008-F02F741FD45D', 1, 1810918800),
(16, 'tkgaming2_nhatrang', 'a281087', 'B3B95384-107C-A3C9-4348-7C10C9A34347', 1, 1780999914),
(17, 'emthien_lamdong', '281087', '03000200-0400-0500-0006-000700080009', 1, 1781010598),
(18, 'lehaidang', 'a25251325a', '7F9E3196-7FD5-66BA-7402-3C7C3F7E8EAF', 1, 1781097714),
(20, 'at_gaming_lamdong', '281087', '18EBE2A1-0FB5-E811-BF49-A4BF014115F8', 1, 1781161582),
(24, 'anphat_nhabesg', '281087', '552AA600-29A1-11E5-83ED-8CDCD452F996', 1, 1781192965),
(25, 'anphat_gamingsg', '281087', '552AA600-29A1-11E5-83ED-8CDCD452F996', 1, 1781346332),
(27, 'quannet_battrang', '281087', '6A1EBD00-7B2A-E511-BC73-000E0C68D362', 1, 1781350590),
(28, 'epi3', '281087', '6CA186E2-FFB3-11E0-BBDA-389234DD2C41', 1, 1781354060),
(29, 'manhpt', 'Abc123!', '0396C150-EE46-DC43-AEE8-08BFB8813086', 1, 1781358454),
(32, 'minhlong_backan', '281087', '00000000-0000-0000-0000-309C23A8AB9E', 1, 1766682000),
(33, 'sos2', '281087', '769D4F99-194C-8587-0E2A-14DDA9D5A007', 1, 1767114000),
(34, 'manhptvivu', 'Abc123!', '54616654-FE4A-E511-BC80-000E0C68D362', 1, 1796058000),
(35, 'anhhung_110tdh', '281087', NULL, 1, 1774890000),
(38, 'conmeo', 'conmeo', '98F396E9-502C-4F70-3B3B-22C505B0ADD7', 1, 1767028184);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `admin_accounts`
--

CREATE TABLE `admin_accounts` (
  `tk` varchar(10) NOT NULL,
  `mk` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_vietnamese_ci;

--
-- Đang đổ dữ liệu cho bảng `admin_accounts`
--

INSERT INTO `admin_accounts` (`tk`, `mk`) VALUES
('admin', 'admin');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Chỉ mục cho bảng `admin_accounts`
--
ALTER TABLE `admin_accounts`
  ADD UNIQUE KEY `tk` (`tk`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
