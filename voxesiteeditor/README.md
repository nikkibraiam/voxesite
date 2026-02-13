Para poder hacer deploy de los archivos estaticos se debe desde apps/runtime, ejecutar pnpm run generate

Para instalar las librerias se debe hacer

pnpm add -Dw @types/node ya que esta en un workspace

Cuando salgan se deje ejecutar 

pnpm -F runtime build
pnpm -F editor build

pnpm dev


para generar una vista del proyecto con todos los files necesarios

find . -type f -not -path "*/node_modules/*" -not -path "*/.nuxt/*"  -not -path "*/.output/*"   -not -path "*/dist/*" 

