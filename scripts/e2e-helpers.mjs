/** Client-side navigation through a real same-origin link, for routes with no
 * nav tab (Blog is unlisted from the header for now). Astro's ClientRouter
 * handles the click exactly as it would a link on the page. */
export const softNavigate = (page, href) => page.evaluate(href => {
  const link = Object.assign(document.createElement('a'), { href })
  document.body.append(link)
  link.click()
  link.remove()
}, href)
