NAME=    Transcendence

# node_modules/ の権限周りのエラーを回避するために
# ホストとコンテナ内のユーザーIDを一致させる必要がある｡
LOCAL_UID=$(shell id -u)
LOCAL_GID=$(shell id -g)

all: $(NAME)

$(NAME):
	$(info UID: $(LOCAL_UID) GID: $(LOCAL_GID))
	LOCAL_UID=$(LOCAL_UID) LOCAL_GID=$(LOCAL_GID) docker-compose -f docker-compose.yml up --build -d

up:
	LOCAL_UID=$(LOCAL_UID) LOCAL_GID=$(LOCAL_GID) docker-compose -f docker-compose.yml up --build

down:
	docker-compose -f docker-compose.yml down

ps:
	docker-compose -f docker-compose.yml ps

logs:
	docker-compose -f docker-compose.yml logs

.PHONY: all $(NAME) up down ps logs

.PHONY:	frontend backend postgres
frontend backend postgres:
	docker-compose -f docker-compose.yml exec $@ /bin/bash
