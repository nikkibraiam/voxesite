export default defineEventHandler(async () => {
  const result = await $fetch('http://localhost:2999/api/demosite/page/home')
  return result
})
