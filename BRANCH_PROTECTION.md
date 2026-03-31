# GitHub Rulesets Configuration

## Cómo configurar las Branch Protection Rules para main

### Opción 1: A través de la interfaz web

1. Ve a: **https://github.com/abelnhm/ollamplus/settings/rules**
2. Clic en **"New ruleset"**
3. Configura como se indica más abajo
4. Save changes

### Opción 2: Usando GitHub CLI (si lo tienes instalado)

```bash
# Autenticar primero
gh auth login

# Crear ruleset (después de autenticar)
gh api -X POST repos/abelnhm/ollamplus/rulesets \
  -f name='Protect main' \
  -f target='main' \
  -f rules='{"require_pull_request":true,"required_reviewers":1,"dismiss_stale_reviews":true,"require_status_checks":true,"block_force_pushes":true}'
```

---

## Configuración Recomendada para OllamPlus

### Ruleset: Protect main

| Setting | Value |
|---------|-------|
| **Target branches** | `main` |
| **Branch rules** | |
| ☑ Require pull request | Yes |
| ☑ Required approving reviewers | **1** |
| ☑ Dismiss stale reviews | Yes |
| ☑ Require status checks to pass | Yes |
| ☑ Require branches to be up to date before merging | Yes |
| ☑ Require conversation resolution | Yes |
| ☑ Block force pushes | Yes |
| ☑ Block force pushes | Apply to administrators: **Yes** |
| ☑ Restrict who can push | No (por ahora) |
| ☑ Allow deletions | **No** |

---

## Después de configurar

Una vez aplicadas las reglas, cualquier push directo a `main` será rechazado. Los cambios deberán pasar por:

1. Crear una rama (`git checkout -b fix/my-fix`)
2. Hacer cambios y commits
3. Crear Pull Request
4. Esperar aprobación (1 reviewer mínimo)
5. Mergear después de pasar los status checks

---

## Status Checks Disponibles

Para que los status checks funcionen, considera añadir GitHub Actions para:

- `npm test` - Ejecutar tests
- `npm run build` - Compilar el proyecto
- `npm run lint` - Verificar TypeScript (o eslint si lo añades)

Ver: `.github/workflows/` para configurar CI/CD automático.
