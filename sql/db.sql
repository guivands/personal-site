drop table if exists post;
drop table if exists directory;

create table directory(
    id bigint primary key auto_increment,
    uniqueName varchar(100) not null,
    path varchar(100) not null,
    fullpath varchar(1000) not null,
    name varchar(20) not null,
    parentId bigint,
    locale varchar(5) not null,
    foreign key (parentId) references directory(id),
    constraint dir_locale_name unique (parentId,name,locale),
    constraint dir_locale_path unique (parentId,path,locale)
);

create table post(
    id bigint primary key auto_increment,
    uniqueName varchar(100) not null,
    title varchar(255),
    description varchar(255),
    tags varchar(255),
    directoryId bigint,
    path varchar(255), -- caminho final do post, seria o titulo em forma de url amigavel
    fullpath varchar(1000) not null,
    post longtext not null,
    locale varchar(5) not null,
    createDate datetime,
    updateDate datetime,
    foreign key (directoryId) references directory(id),
    constraint unique_post_title unique (title),
    constraint unique_post_path unique (directoryId,path),
    constraint post_unique_name unique (uniqueName)
);


create or replace view postless as select id, uniqueName, title, description, tags, directoryId, path, locale, createDate, updateDate from post;
