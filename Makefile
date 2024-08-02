.PHONY: stop build start restart

stop:
	pm2 stop all

build:
	npm run build

start:
	pm2 start dist/main.js

restart: stop build start