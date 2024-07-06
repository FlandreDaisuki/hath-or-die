# hath-or-die

- [x] watch gallery downloading until it complete
- [x] archive gallery into repository
  - [x] write it into db
  - [x] sync full metadata into db
- [x] rating pages
  - [x] CRUD in db
  - [x] low rate to delete
- [ ] ~~scheduling update the same name gallery~~

---

- [ ] error handlings

## Development

```sh
docker compose -p hath-or-die -f docker/docker-compose.yml up --build
```
