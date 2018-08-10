-- /enigma/tao.jiang/datasets/JingJinJi/entropy/matrix/beijing

CREATE TABLE `tdnormal`.`bjRC0mat` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `wpnumber` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
ALTER  TABLE `tdnormal`.`bjRC0mat` ADD PRIMARY KEY (`id`), ADD KEY `wpnumber_1` (`wpnumber`)

LOAD DATA LOCAL INFILE "/enigma/tao.jiang/datasets/JingJinJi/entropy_range/commutation/matrix/beijing/respeo-00-xxx" INTO TABLE bjRC0mat COLUMNS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '' ESCAPED BY '"' LINES TERMINATED BY '\n' (@col1,@col2) set id=@col1,wpnumber=@col2;


CREATE TABLE `tdnormal`.`bjRC1mat` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `wpnumber` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
ALTER  TABLE `tdnormal`.`bjRC1mat` ADD PRIMARY KEY (`id`), ADD KEY `wpnumber_1` (`wpnumber`)

LOAD DATA LOCAL INFILE "/enigma/tao.jiang/datasets/JingJinJi/entropy_range/commutation/matrix/beijing/respeo-01-xxx" INTO TABLE bjRC1mat COLUMNS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '' ESCAPED BY '"' LINES TERMINATED BY '\n' (@col1,@col2) set id=@col1,wpnumber=@col2;


CREATE TABLE `tdnormal`.`bjRC2mat` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `wpnumber` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
ALTER  TABLE `tdnormal`.`bjRC2mat` ADD PRIMARY KEY (`id`), ADD KEY `wpnumber_1` (`wpnumber`)

LOAD DATA LOCAL INFILE "/enigma/tao.jiang/datasets/JingJinJi/entropy_range/commutation/matrix/beijing/respeo-02-xxx" INTO TABLE bjRC2mat COLUMNS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '' ESCAPED BY '"' LINES TERMINATED BY '\n' (@col1,@col2) set id=@col1,wpnumber=@col2;


