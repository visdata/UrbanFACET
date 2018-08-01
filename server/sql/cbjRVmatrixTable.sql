-- /enigma/tao.jiang/datasets/JingJinJi/entropy/matrix/beijing

CREATE TABLE `tdnormal`.`bjRV0mat` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `wpnumber` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
ALTER  TABLE `tdnormal`.`bjRV0mat` ADD PRIMARY KEY (`id`), ADD KEY `wpnumber_1` (`wpnumber`)

LOAD DATA LOCAL INFILE "/enigma/tao.jiang/datasets/JingJinJi/entropy_range/matrix/beijing/respeo-00-xxx" INTO TABLE bjRV0mat COLUMNS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '' ESCAPED BY '"' LINES TERMINATED BY '\n' (@col1,@col2) set id=@col1,wpnumber=@col2;


CREATE TABLE `tdnormal`.`bjRV1mat` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `wpnumber` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
ALTER  TABLE `tdnormal`.`bjRV1mat` ADD PRIMARY KEY (`id`), ADD KEY `wpnumber_1` (`wpnumber`)

LOAD DATA LOCAL INFILE "/enigma/tao.jiang/datasets/JingJinJi/entropy_range/matrix/beijing/respeo-01-xxx" INTO TABLE bjRV1mat COLUMNS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '' ESCAPED BY '"' LINES TERMINATED BY '\n' (@col1,@col2) set id=@col1,wpnumber=@col2;


CREATE TABLE `tdnormal`.`bjRV2mat` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `wpnumber` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
ALTER  TABLE `tdnormal`.`bjRV2mat` ADD PRIMARY KEY (`id`), ADD KEY `wpnumber_1` (`wpnumber`)

LOAD DATA LOCAL INFILE "/enigma/tao.jiang/datasets/JingJinJi/entropy_range/matrix/beijing/respeo-02-xxx" INTO TABLE bjRV2mat COLUMNS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '' ESCAPED BY '"' LINES TERMINATED BY '\n' (@col1,@col2) set id=@col1,wpnumber=@col2;


