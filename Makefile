NAME=    Transcendence

.PHONY: all
all: $(NAME)

.PHONY: $(NAME)
$(NAME): up

.PHONY: up
up:
	docker-compose -f docker-compose.yml up --build

.PHONY: down
down:
	docker-compose -f docker-compose.yml down

.PHONY: ps
ps:
	docker-compose -f docker-compose.yml ps

.PHONY: logs
logs:
	docker-compose -f docker-compose.yml logs

# ========== 以下開発用 ==========

# node_modules/ の権限周りのエラーを回避するために
# ホストとコンテナ内のユーザーIDを一致させる必要がある｡
LOCAL_UID=$(shell id -u)
LOCAL_GID=$(shell id -g)

.PHONY: up-dev
up-dev:
	$(info UID: $(LOCAL_UID) GID: $(LOCAL_GID))
	LOCAL_UID=$(LOCAL_UID) LOCAL_GID=$(LOCAL_GID) docker-compose -f docker-compose.dev.yml up --build

.PHONY: down-dev
down-dev:
	docker-compose -f docker-compose.dev.yml down

.PHONY: ps-dev
ps-dev:
	docker-compose -f docker-compose.dev.yml ps

.PHONY: logs-dev
logs-dev:
	docker-compose -f docker-compose.dev.yml logs

.PHONY:	frontend backend postgres
frontend backend postgres:
	docker-compose -f docker-compose.dev.yml exec $@ /bin/bash
