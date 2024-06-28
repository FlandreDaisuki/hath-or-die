FROM alpine:3.19.1

RUN apk add --no-cache inotify-tools jq 7zip libwebp-tools sqlite \
 && addgroup -g 1000 yomiko \
 && adduser -u 1000 -G yomiko -h /home/yomiko -s /bin/bash -D yomiko

# ref: https://stackoverflow.com/a/63110882
RUN apk add --no-cache dcron libcap \
 && chown yomiko:yomiko /usr/sbin/crond \
 && setcap cap_setgid=ep /usr/sbin/crond

WORKDIR /home/yomiko

COPY ../bin/* /home/yomiko/bin/
COPY ../crontabs/yomiko /home/yomiko/crontabs/

RUN chmod +x /home/yomiko/bin/* \
 && mkdir -p /home/yomiko/downloading /home/yomiko/logs \
 && chown -R yomiko:yomiko /home/yomiko

ENV PATH="/home/yomiko/bin:$PATH"

USER yomiko

CMD [ "/home/yomiko/bin/entry.sh" ]
