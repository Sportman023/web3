default: print_start stop build start print_end

print_start:
	@echo "Start."

print_end:
	@echo "End."

stop:
	pm2 stop all

build:
	npm run build

start:
	pm2 start dist/main.js