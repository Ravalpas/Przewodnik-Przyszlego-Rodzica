FROM node:24-alpine
WORKDIR /app
COPY package.json server.mjs ./
COPY backend ./backend
COPY dist ./dist
RUN mkdir -p /app/data && chown -R node:node /app
USER node
ENV PORT=3000 DATA_DIR=/app/data PPM_STARTUP_CHECK=1 TZ=Europe/Warsaw
VOLUME ["/app/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","server.mjs"]
