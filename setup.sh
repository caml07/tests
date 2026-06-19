#!/bin/bash
# setup.sh - Prepara entorno SSH para trabajar con el repo

cd /c/dev/nr || exit 1

echo "Iniciando ssh-agent..."
eval "$(ssh-agent -s)"

echo "Agregando llave SSH (te pedirá la contraseña)..."
ssh-add ~/.ssh/id_apphass_ed25519

echo "Verificando conexión con GitHub..."
ssh -T git@github.com

echo "Entorno listo. Ya puedes usar git push, git pull, etc."
