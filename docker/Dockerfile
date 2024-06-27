FROM alpine:3.19.1

RUN apk add --no-cache inotify-tools jq 7zip libwebp-tools sqlite \
 && addgroup -g 1000 yomiko \
 && adduser -u 1000 -G yomiko -h /home/yomiko -s /bin/bash -D yomiko

WORKDIR /home/yomiko

COPY ../archive-gallery ../watch-gallery-downloaded /home/yomiko/bin/

RUN chmod +x /home/yomiko/bin/* \
 && chown -R yomiko:yomiko /home/yomiko \
 && mkdir -p /home/yomiko/downloading

ENV PATH="/home/yomiko/bin:$PATH"

USER yomiko

CMD [ "/home/yomiko/bin/watch-gallery-downloaded" ]
