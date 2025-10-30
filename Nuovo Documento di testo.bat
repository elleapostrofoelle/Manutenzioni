# Elimina le cartelle di output e dei moduli
rmdir /s /q dist
rmdir /s /q node_modules

# Elimina i file di lock
del package-lock.json
del yarn.lock # Se usi yarn

# Pulisci la cache di npm/yarn
npm cache clean --force
# O se usi yarn: yarn cache clean