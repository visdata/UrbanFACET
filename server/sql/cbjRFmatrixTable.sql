-- /enigma/tao.jiang/datasets/JingJinJi/entropy/matrix/beijing

CREATE TABLE `tdnormal`.`bjRF0mat` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `wpnumber` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
ALTER  TABLE `tdnormal`.`bjRF0mat` ADD PRIMARY KEY (`id`), ADD KEY `wpnumber_1` (`wpnumber`)

LOAD DATA LOCAL INFILE "/enigma/tao.jiang/datasets/JingJinJi/entropy_range/fluidity/matrix/beijing/respeo-00-xxx" INTO TABLE bjRF0mat COLUMNS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '' ESCAPED BY '"' LINES TERMINATED BY '\n' (@col1,@col2) set id=@col1,wpnumber=@col2;


CREATE TABLE `tdnormal`.`bjRF1mat` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `wpnumber` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
ALTER  TABLE `tdnormal`.`bjRF1mat` ADD PRIMARY KEY (`id`), ADD KEY `wpnumber_1` (`wpnumber`)

LOAD DATA LOCAL INFILE "/enigma/tao.jiang/datasets/JingJinJi/entropy_range/fluidity/matrix/beijing/respeo-01-xxx" INTO TABLE bjRF1mat COLUMNS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '' ESCAPED BY '"' LINES TERMINATED BY '\n' (@col1,@col2) set id=@col1,wpnumber=@col2;


CREATE TABLE `tdnormal`.`bjRF2mat` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `wpnumber` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
ALTER  TABLE `tdnormal`.`bjRF2mat` ADD PRIMARY KEY (`id`), ADD KEY `wpnumber_1` (`wpnumber`)

LOAD DATA LOCAL INFILE "/enigma/tao.jiang/datasets/JingJinJi/entropy_range/fluidity/matrix/beijing/respeo-02-xxx" INTO TABLE bjRF2mat COLUMNS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '' ESCAPED BY '"' LINES TERMINATED BY '\n' (@col1,@col2) set id=@col1,wpnumber=@col2;


