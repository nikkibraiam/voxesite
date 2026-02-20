Para poder hacer deploy de los archivos estaticos se debe desde apps/runtime, ejecutar pnpm run generate

Para instalar las librerias se debe hacer

pnpm add -Dw @types/node ya que esta en un workspace

Cuando salgan se deje ejecutar 

pnpm -F runtime build
pnpm -F editor build

pnpm dev


para generar una vista del proyecto con todos los files necesarios

find . -type f -not -path "*/node_modules/*" -not -path "*/.nuxt/*"  -not -path "*/.output/*"   -not -path "*/dist/*" 



Tiene 3 proyectos.
1. en apps/editor: se encarga de armar el ambiente para que se edite el contenido
2. en apps/runtime: Se encarga de renderizar los cambios aplicacos del contenido
3. node-build-server: Se encarga de ejectuarse como server para los procesos.

Para lanzar es pnpm dev con eso lanza las app
Para lanzar el server posicionarse dentro de node-build-server y ejecutar pnpm dev