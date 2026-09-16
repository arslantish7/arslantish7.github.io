# Arslan Ghani — Portfolio

Personal portfolio website for **Arslan Ghani**, Computer Science graduate and web developer based in Lahore, Pakistan.

Built with plain HTML, CSS and JavaScript. No frameworks, no build step, and no dependencies.

## Features

- **Interactive hero:** a particle network that reacts to the cursor, a typing tagline, a 3D-tilting code window, floating tech badges and magnetic buttons
- **Scroll effects:** content fades in as you scroll, the stats count up, a reading-progress bar sits under the header, and the menu highlights the section in view
- **Project case studies:** a page for each project with overview, key features, role, tech stack and next/previous navigation
- **Working contact form:** inline validation, spam protection, and loading, success and error states, powered by Web3Forms
- **Light and dark themes:** follows the visitor's system setting, remembers their choice, no flash on load
- **Accessible:** semantic landmarks, skip link, keyboard-friendly menu, visible focus styles, WCAG AA contrast, screen-reader-friendly animations. All motion is switched off for visitors who ask for reduced motion.
- **SEO-ready:** meta descriptions, Open Graph and Twitter cards, structured data (JSON-LD)
- **Robust:** works when opened straight from disk (`file://`) or from any static host, and stays readable with JavaScript disabled

## Project structure

```
index.html                     Home page (hero, about, skills, projects, experience, education, contact)
projects/
  social-media-agent.html      Case-study pages, one per project
  online-rental-platform.html
  inventory-management-system.html
  learning-management-system.html
404.html                       "Page not found" page
favicon.svg                    Site icon
css/style.css                  All styles (design tokens at the top)
js/main.js                     All interactions (theme, menu, animations, contact form)
assets/
  Arslan_Ghani_Resume.pdf      Résumé linked from the header and hero
  og-image.png                 1200×630 preview image for social sharing
  icons/apple-touch-icon.png
  images/project-*.svg         Project illustrations
_archive/                      Previous version of the site (safe to delete; don't deploy it)
```

## Run it locally

Double-click `index.html`, or serve the folder:

```bash
npx serve .
```

## Contact form

The form is set up. Messages go to **arslanmunn5@gmail.com** through Web3Forms (free plan).

- The access key is in `index.html` (`<input type="hidden" name="access_key" …>`). It is designed to be public, so it's safe to keep in the HTML.
- To use a different email address, create a new key at <https://web3forms.com> and replace the value.
- Leave Web3Forms' "Restrict to Domain" setting off. If it's turned on, the form stops working when you open the site from your computer.
- If the access key is ever removed, the form still works: it opens the visitor's email app with the message filled in.

## Editing content

- **Home page text:** everything is in `index.html`, and each section is marked with a comment (`About`, `Skills`, `Projects`, …).
- **Case studies:** edit the matching file in `projects/`. Each page's sidebar has a commented-out template for adding **View source code** and **Live demo** buttons when you have them.
- **Add a project:** copy a `<article class="card project-card">` block in `index.html`, copy one of the `projects/*.html` pages, and add an 800×500 image to `assets/images/`. Update the "Previous / Next project" links at the bottom of the neighbouring case studies.
- **Hero typing phrases:** edit the `data-typed` list in `index.html`.
- **Update the résumé:** replace `assets/Arslan_Ghani_Resume.pdf` and keep the same file name.
- **Change colours:** edit the variables at the top of `css/style.css` (the light theme is under `:root`, the dark theme under `[data-theme='dark']`).

## Live site and deploying

**Live at <https://arslantish7.github.io>**, hosted free on GitHub Pages from the `main` branch of
[arslantish7/arslantish7.github.io](https://github.com/arslantish7/arslantish7.github.io).

To publish a change, commit and push. GitHub Pages redeploys automatically within a minute or two:

```bash
git add -A
git commit -m "Describe your change"
git push
```

- `_archive/` and `.kiro/` are listed in `.gitignore`, so they are never uploaded.
- `.nojekyll` tells GitHub Pages to serve the files exactly as they are.
- `sitemap.xml` and `robots.txt` help search engines find every page. Add new pages to `sitemap.xml`.
- Share previews (LinkedIn, WhatsApp, X) use `assets/og-image.png`, and every page has its canonical URL set.

## Contact

- Email: [arslanmunn5@gmail.com](mailto:arslanmunn5@gmail.com)
- LinkedIn: [arslan-ghani-a5aa98302](https://www.linkedin.com/in/arslan-ghani-a5aa98302)
- GitHub: [arslantish7](https://github.com/arslantish7)
