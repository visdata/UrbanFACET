-- // huilongguan
-- // Query OK, 4957 rows affected (14.13 sec)
-- // Query OK, 124985 rows affected (14.16 sec)

-- // tiantongyuan
-- // Query OK, 2467 rows affected (9.06 sec)
-- // Query OK, 51228 rows affected (9.13 sec)

-- // beihang
-- // Query OK, 887 rows affected (10.09 sec)
-- // Query OK, 9224 rows affected (8.24 sec)

-- // xizhimen
-- // Query OK, 7306 rows affected (4 min 59.70 sec)
-- // Query OK, 87186 rows affected (2.94 sec)

-- // bjxizhan
-- // Query OK, 1457 rows affected (6.34 sec)
-- // Query OK, 4179 rows affected (5.47 sec)

// get idlist and records for specific regions 
huilongguan_idlist: "SELECT DISTINCT(tdid) from cbeijing WHERE lat >40.0581 AND lat<40.0933 AND lng >116.2917 AND lng <116.3694 INTO OUTFILE '/tmp/huilongguan-idlist.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';",
huilongguan_records: "SELECT * from cbeijing WHERE tdid in (SELECT DISTINCT(tdid) from cbeijing WHERE lat >40.0581 AND lat<40.0933 AND lng >116.2917 AND lng <116.3694) INTO OUTFILE '/tmp/huilongguan-records.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';",

tiantongyuan_idlist: "SELECT DISTINCT(tdid) from cbeijing WHERE lat >40.0565 AND lat<40.0782 AND lng >116.3991 AND lng <116.4360 INTO OUTFILE '/tmp/tiantongyuan-idlist.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';",
tiantongyuan_records: "SELECT * from cbeijing WHERE tdid in (SELECT DISTINCT(tdid) from cbeijing WHERE lat >40.0565 AND lat<40.0782 AND lng >116.3991 AND lng <116.4360) INTO OUTFILE '/tmp/tiantongyuan-records.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';",

beihang_idlist: "SELECT DISTINCT(tdid) from cbeijing WHERE lat >39.9759 AND lat<39.9848 AND lng >116.3353 AND lng <116.3474 INTO OUTFILE '/tmp/beihang-idlist.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';",
beihang_records: "SELECT * from cbeijing WHERE tdid in (SELECT DISTINCT(tdid) from cbeijing WHERE lat >39.9759 AND lat<39.9848 AND lng >116.3353 AND lng <116.3474) as temp INTO OUTFILE '/tmp/beihang-records.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';",

xizhimen_idlist: "SELECT DISTINCT(tdid) from cbeijing WHERE lat >39.9272 AND lat<39.9555 AND lng >116.3198 AND lng <116.3604 INTO OUTFILE '/tmp/xizhimen-idlist.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';",
xizhimen_records: "SELECT * from cbeijing WHERE tdid in (SELECT DISTINCT(tdid) from cbeijing WHERE lat >39.9272 AND lat<39.9555 AND lng >116.3198 AND lng <116.3604) INTO OUTFILE '/tmp/xizhimen-records.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';",

bjxizhan_idlist: "SELECT DISTINCT(tdid) from cbeijing WHERE lat >39.8924 AND lat<39.8958 AND lng >116.3103 AND lng <116.3199 INTO OUTFILE '/tmp/bjxizhan-idlist.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';",
bjxizhan_records: "SELECT * from cbeijing WHERE tdid in (SELECT DISTINCT(tdid) from cbeijing WHERE lat >39.8924 AND lat<39.8958 AND lng >116.3103 AND lng <116.3199) INTO OUTFILE '/tmp/bjxizhan-records.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';",

gugong_idlist: "SELECT DISTINCT(tdid) from cbeijing WHERE lat >39.9119 AND lat<39.9215 AND lng >116.3858 AND lng <116.3958 INTO OUTFILE '/tmp/gugong-idlist.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"

// huilongguan
CREATE TABLE `tsu_explore`.`bj_hlg_records` ( `id` int(11) NOT NULL, `tdid` int(11) NOT NULL, `dayType` char(10) NOT NULL, `dateID` int(11) NOT NULL, `timeID` int(11) NOT NULL, `lat` double NOT NULL, `lng` double NOT NULL, `timeSegID` int(11) NOT NULL, `gridUID` char(10) DEFAULT '-1' ) ENGINE=InnoDB DEFAULT CHARSET=latin1; ALTER TABLE `tsu_explore`.`bj_hlg_records` ADD PRIMARY KEY (`id`), ADD KEY `lat` (`lat`,`lng`), ADD KEY `tdid` (`tdid`,`dayType`,`dateID`,`timeID`), ADD KEY `tdid_2` (`tdid`,`dayType`,`dateID`,`timeID`,`lat`,`lng`), ADD KEY `tdid_3` (`tdid`,`dayType`,`dateID`,`timeSegID`), ADD KEY `tdid_4` (`tdid`,`dayType`,`timeSegID`); ALTER TABLE `tsu_explore`.`bj_hlg_records` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
CREATE TABLE `tsu_explore`.`bj_hlg_idlist` ( `id` int(11) NOT NULL ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOAD DATA LOCAL INFILE '/home/taojiang/git/living-modes-visual-comparison/server/data/tmp/huilongguan-records.csv'
INTO TABLE bj_hlg_records
FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'
(@col1,@col2,@col3,@col4,@col5,@col6,@col7,@col8,@col9)
set tdid=@col2, dayType=@col3, dateID=@col4, timeID=@col5, lat=@col6, lng=@col7, timeSegID=@col8, gridUID=@col9;

LOAD DATA LOCAL INFILE '/home/taojiang/git/living-modes-visual-comparison/server/data/tmp/huilongguan-idlist.csv'
INTO TABLE bj_hlg_idlist
FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'
(@col1) set id=@col1;

// beihang
CREATE TABLE `tsu_explore`.`bj_bh_records` ( `id` int(11) NOT NULL, `tdid` int(11) NOT NULL, `dayType` char(10) NOT NULL, `dateID` int(11) NOT NULL, `timeID` int(11) NOT NULL, `lat` double NOT NULL, `lng` double NOT NULL, `timeSegID` int(11) NOT NULL, `gridUID` char(10) DEFAULT '-1' ) ENGINE=InnoDB DEFAULT CHARSET=latin1; ALTER TABLE `tsu_explore`.`bj_bh_records` ADD PRIMARY KEY (`id`), ADD KEY `lat` (`lat`,`lng`), ADD KEY `tdid` (`tdid`,`dayType`,`dateID`,`timeID`), ADD KEY `tdid_2` (`tdid`,`dayType`,`dateID`,`timeID`,`lat`,`lng`), ADD KEY `tdid_3` (`tdid`,`dayType`,`dateID`,`timeSegID`), ADD KEY `tdid_4` (`tdid`,`dayType`,`timeSegID`); ALTER TABLE `tsu_explore`.`bj_bh_records` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
CREATE TABLE `tsu_explore`.`bj_bh_idlist` ( `id` int(11) NOT NULL ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOAD DATA LOCAL INFILE '/home/taojiang/git/living-modes-visual-comparison/server/data/tmp/beihang-records.csv'
INTO TABLE beijing_bh_records
FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'
(@col1,@col2,@col3,@col4,@col5,@col6,@col7,@col8,@col9)
set tdid=@col2, dayType=@col3, dateID=@col4, timeID=@col5, lat=@col6, lng=@col7, timeSegID=@col8, gridUID=@col9;

LOAD DATA LOCAL INFILE '/home/taojiang/git/living-modes-visual-comparison/server/data/tmp/beihang-idlist.csv'
INTO TABLE beijing_bh_idlist
FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'
(@col1) set id=@col1;

// tiantongyuan
CREATE TABLE `tsu_explore`.`beijing_tty_records` ( `id` int(11) NOT NULL, `tdid` int(11) NOT NULL, `dayType` char(10) NOT NULL, `dateID` int(11) NOT NULL, `timeID` int(11) NOT NULL, `lat` double NOT NULL, `lng` double NOT NULL, `timeSegID` int(11) NOT NULL, `gridUID` char(10) DEFAULT '-1' ) ENGINE=InnoDB DEFAULT CHARSET=latin1; ALTER TABLE `tsu_explore`.`beijing_tty_records` ADD PRIMARY KEY (`id`), ADD KEY `lat` (`lat`,`lng`), ADD KEY `tdid` (`tdid`,`dayType`,`dateID`,`timeID`), ADD KEY `tdid_2` (`tdid`,`dayType`,`dateID`,`timeID`,`lat`,`lng`), ADD KEY `tdid_3` (`tdid`,`dayType`,`dateID`,`timeSegID`), ADD KEY `tdid_4` (`tdid`,`dayType`,`timeSegID`); ALTER TABLE `tsu_explore`.`beijing_tty_records` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
CREATE TABLE `tsu_explore`.`beijing_tty_idlist` ( `id` int(11) NOT NULL ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOAD DATA LOCAL INFILE '/home/taojiang/git/living-modes-visual-comparison/server/data/tmp/tiantongyuan-idlist.csv'
INTO TABLE beijing_tty_idlist
FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'
(@col1) set id=@col1;

LOAD DATA LOCAL INFILE '/home/taojiang/git/living-modes-visual-comparison/server/data/tmp/tiantongyuan-records.csv'
INTO TABLE beijing_tty_records
FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'
(@col1,@col2,@col3,@col4,@col5,@col6,@col7,@col8,@col9)
set tdid=@col2, dayType=@col3, dateID=@col4, timeID=@col5, lat=@col6, lng=@col7, timeSegID=@col8, gridUID=@col9;

// xizhimen
CREATE TABLE `tsu_explore`.`beijing_xzm_records` ( `id` int(11) NOT NULL, `tdid` int(11) NOT NULL, `dayType` char(10) NOT NULL, `dateID` int(11) NOT NULL, `timeID` int(11) NOT NULL, `lat` double NOT NULL, `lng` double NOT NULL, `timeSegID` int(11) NOT NULL, `gridUID` char(10) DEFAULT '-1' ) ENGINE=InnoDB DEFAULT CHARSET=latin1; ALTER TABLE `tsu_explore`.`beijing_xzm_records` ADD PRIMARY KEY (`id`), ADD KEY `lat` (`lat`,`lng`), ADD KEY `tdid` (`tdid`,`dayType`,`dateID`,`timeID`), ADD KEY `tdid_2` (`tdid`,`dayType`,`dateID`,`timeID`,`lat`,`lng`), ADD KEY `tdid_3` (`tdid`,`dayType`,`dateID`,`timeSegID`), ADD KEY `tdid_4` (`tdid`,`dayType`,`timeSegID`); ALTER TABLE `tsu_explore`.`beijing_xzm_records` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
CREATE TABLE `tsu_explore`.`beijing_xzm_idlist` ( `id` int(11) NOT NULL ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOAD DATA LOCAL INFILE '/home/taojiang/git/living-modes-visual-comparison/server/data/tmp/xizhimen-idlist.csv'
INTO TABLE beijing_xzm_idlist
FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'
(@col1) set id=@col1;

LOAD DATA LOCAL INFILE '/home/taojiang/git/living-modes-visual-comparison/server/data/tmp/xizhimen-records.csv'
INTO TABLE beijing_xzm_records
FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'
(@col1,@col2,@col3,@col4,@col5,@col6,@col7,@col8,@col9)
set tdid=@col2, dayType=@col3, dateID=@col4, timeID=@col5, lat=@col6, lng=@col7, timeSegID=@col8, gridUID=@col9;

// bjxz
CREATE TABLE `tsu_explore`.`beijing_bjxz_records` ( `id` int(11) NOT NULL, `tdid` int(11) NOT NULL, `dayType` char(10) NOT NULL, `dateID` int(11) NOT NULL, `timeID` int(11) NOT NULL, `lat` double NOT NULL, `lng` double NOT NULL, `timeSegID` int(11) NOT NULL, `gridUID` char(10) DEFAULT '-1' ) ENGINE=InnoDB DEFAULT CHARSET=latin1; ALTER TABLE `tsu_explore`.`beijing_bjxz_records` ADD PRIMARY KEY (`id`), ADD KEY `lat` (`lat`,`lng`), ADD KEY `tdid` (`tdid`,`dayType`,`dateID`,`timeID`), ADD KEY `tdid_2` (`tdid`,`dayType`,`dateID`,`timeID`,`lat`,`lng`), ADD KEY `tdid_3` (`tdid`,`dayType`,`dateID`,`timeSegID`), ADD KEY `tdid_4` (`tdid`,`dayType`,`timeSegID`); ALTER TABLE `tsu_explore`.`beijing_bjxz_records` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
CREATE TABLE `tsu_explore`.`beijing_bjxz_idlist` ( `id` int(11) NOT NULL ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOAD DATA LOCAL INFILE '/home/taojiang/git/living-modes-visual-comparison/server/data/tmp/bjxizhan-records.csv'
INTO TABLE beijing_bjxz_records
FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'
(@col1,@col2,@col3,@col4,@col5,@col6,@col7,@col8,@col9)
set tdid=@col2, dayType=@col3, dateID=@col4, timeID=@col5, lat=@col6, lng=@col7, timeSegID=@col8, gridUID=@col9;

LOAD DATA LOCAL INFILE '/home/taojiang/git/living-modes-visual-comparison/server/data/tmp/bjxizhan-idlist.csv'
INTO TABLE beijing_bjxz_idlist
FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n'
(@col1) set id=@col1;