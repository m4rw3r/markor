BIN ?= $(shell npm bin)

.PHONY: test
test:
	$(BIN)/tap -Rspec tests/*.js

.PHONY: flow
flow:
	$(BIN)/flow check .

.PHONY: watch
watch:
	$(BIN)/nodemon -w src -w tests --exec 'make flow test || exit 1'
