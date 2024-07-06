FROM oven/bun:1.1.17-alpine AS bun-stage

ARG GLIBC_VERSION=2.34-r0
ARG GLIBC_VERSION_AARCH64=2.26-r1

# ref: https://github.com/oven-sh/bun/blob/14c23cc429521bd935b2a0dafa36b0966685b0fe/dockerhub/alpine/Dockerfile
RUN apk --no-cache add \
    ca-certificates \
    curl \
 && arch="$(apk --print-arch)" \
 && cd /tmp \
 && case "${arch##*-}" in \
      x86_64) curl "https://github.com/sgerrand/alpine-pkg-glibc/releases/download/${GLIBC_VERSION}/glibc-${GLIBC_VERSION}.apk" \
        -fsSLO \
        --compressed \
        --retry 5 \
        || (echo "error: failed to download: glibc v${GLIBC_VERSION}" && exit 1) \
      && mv "glibc-${GLIBC_VERSION}.apk" glibc.apk \
      && curl "https://github.com/sgerrand/alpine-pkg-glibc/releases/download/${GLIBC_VERSION}/glibc-bin-${GLIBC_VERSION}.apk" \
        -fsSLO \
        --compressed \
        --retry 5 \
        || (echo "error: failed to download: glibc-bin v${GLIBC_VERSION}" && exit 1) \
      && mv "glibc-bin-${GLIBC_VERSION}.apk" glibc-bin.apk ;; \
      aarch64) curl "https://raw.githubusercontent.com/squishyu/alpine-pkg-glibc-aarch64-bin/master/glibc-${GLIBC_VERSION_AARCH64}.apk" \
        -fsSLO \
        --compressed \
        --retry 5 \
        || (echo "error: failed to download: glibc v${GLIBC_VERSION_AARCH64}" && exit 1) \
      && mv "glibc-${GLIBC_VERSION_AARCH64}.apk" glibc.apk \
      && curl "https://raw.githubusercontent.com/squishyu/alpine-pkg-glibc-aarch64-bin/master/glibc-bin-${GLIBC_VERSION_AARCH64}.apk" \
        -fsSLO \
        --compressed \
        --retry 5 \
        || (echo "error: failed to download: glibc-bin v${GLIBC_VERSION_AARCH64}" && exit 1) \
      && mv "glibc-bin-${GLIBC_VERSION_AARCH64}.apk" glibc-bin.apk ;; \
      *) echo "error: unsupported architecture '$arch'"; exit 1 ;; \
    esac

FROM alpine:3.19.1

COPY --from=bun-stage /usr/local/bin/bun /usr/local/bin/

RUN --mount=type=bind,from=bun-stage,source=/tmp,target=/tmp \
    apk --no-cache --force-overwrite --allow-untrusted add \
      /tmp/glibc.apk \
      /tmp/glibc-bin.apk \
    && ln -s /usr/local/bin/bun /usr/local/bin/bunx

RUN apk add --no-cache jq 7zip libwebp-tools sqlite ripgrep curl \
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
