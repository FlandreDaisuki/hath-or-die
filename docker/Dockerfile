FROM oven/bun:1.2.10-alpine

RUN apk add --no-cache \
    7zip \
    bash \
    curl \
    imagemagick \
    jq \
    libwebp-tools \
    ripgrep \
    sqlite \
 && deluser --remove-home bun \
 && addgroup -g 1000 yomiko \
 && adduser -u 1000 -G yomiko -h /home/yomiko -s /bin/bash -D yomiko

# ref: https://stackoverflow.com/a/63110882
RUN apk add --no-cache dcron libcap \
 && chown yomiko:yomiko /usr/sbin/crond \
 && setcap cap_setgid=ep /usr/sbin/crond

WORKDIR /home/yomiko

COPY .. /home/yomiko/

RUN chmod +x /home/yomiko/bin/* \
 && mkdir -p /home/yomiko/downloading /home/yomiko/logs \
 && chown -R yomiko:yomiko /home/yomiko

ENV PATH="/home/yomiko/bin:$PATH"

USER yomiko

CMD [ "/home/yomiko/bin/entry.sh" ]
