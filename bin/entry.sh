#!/bin/sh

crond -l 2 -c /home/yomiko/crontabs -L /home/yomiko/logs/dcron.log

bun /home/yomiko/server/app.js
