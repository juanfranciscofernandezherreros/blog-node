🚀 Usuarios creados y sus roles asignados
Username	Email	Roles asignados
superAdmin	admin@example.com	admin, editor
contentEditor	editor@example.com	editor
regularUser	user@example.com	user
studentInstructor	studentInstructor@example.com	student, instructor
dualRoleUser	dual@example.com	user, editor
studentUser	student@example.com	student
instructorUser	instructor@example.com	instructor

{
  "title": "Introducción a Spring Boot con Seguridad JWT",
  "slug": "introduccion-spring-boot-con-seguridad-jwt",
  "summary": "Guía práctica para asegurar tus APIs REST con JWT en Spring Boot.",
  "body": "<h2>¿Por qué usar JWT con Spring Boot?</h2>\n<p>Proteger tus APIs REST es fundamental. <strong>JSON Web Token (JWT)</strong> permite autenticar usuarios sin necesidad de mantener sesiones en el servidor, lo que se traduce en una arquitectura <em>stateless</em> ideal para microservicios.</p>\n\n<h2>Configuración básica del proyecto</h2>\n<p>Para empezar, necesitas incluir estas dependencias en tu <code>pom.xml</code>:</p>\n<pre><code class=\"language-xml\">&lt;dependency&gt;\n  &lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;\n  &lt;artifactId&gt;spring-boot-starter-security&lt;/artifactId&gt;\n&lt;/dependency&gt;\n&lt;dependency&gt;\n  &lt;groupId&gt;io.jsonwebtoken&lt;/groupId&gt;\n  &lt;artifactId&gt;jjwt&lt;/artifactId&gt;\n  &lt;version&gt;0.9.1&lt;/version&gt;\n&lt;/dependency&gt;</code></pre>\n\n<h2>Generación del token JWT</h2>\n<p>Una vez autenticado el usuario, generamos un token con los datos esenciales:</p>\n<pre><code class=\"language-java\">String token = Jwts.builder()\n    .setSubject(user.getUsername())\n    .claim(\"role\", user.getRole())\n    .setIssuedAt(new Date())\n    .setExpiration(new Date(System.currentTimeMillis() + 86400000))\n    .signWith(SignatureAlgorithm.HS256, SECRET_KEY)\n    .compact();</code></pre>\n\n<h2>Filtro de autenticación</h2>\n<p>Para validar el token en cada petición, implementamos un filtro:</p>\n<pre><code class=\"language-java\">public class JwtAuthFilter extends OncePerRequestFilter {\n  @Override\n  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)\n      throws ServletException, IOException {\n    String header = request.getHeader(\"Authorization\");\n    if (header != null && header.startsWith(\"Bearer \")) {\n      String token = header.substring(7);\n      String username = Jwts.parser()\n          .setSigningKey(SECRET_KEY)\n          .parseClaimsJws(token)\n          .getBody()\n          .getSubject();\n      // cargar usuario y establecer autenticación en contexto\n    }\n    filterChain.doFilter(request, response);\n  }\n}</code></pre>\n\n<h2>Protegiendo endpoints</h2>\n<p>Utiliza anotaciones como <code>@PreAuthorize(\"hasRole('ADMIN')\")</code> para restringir el acceso a ciertos endpoints:</p>\n<pre><code class=\"language-java\">@RestController\n@RequestMapping(\"/admin\")\npublic class AdminController {\n\n  @GetMapping(\"/config\")\n  @PreAuthorize(\"hasRole('ADMIN')\")\n  public String config() {\n    return \"Solo para administradores\";\n  }\n}</code></pre>\n\n<h2>Buenas prácticas</h2>\n<ul>\n  <li>Usa HTTPS para proteger el token en tránsito</li>\n  <li>Agrega expiración corta al token y usa tokens de refresco</li>\n  <li>No almacenes información sensible en el <em>payload</em> del token</li>\n  <li>Regenera el token si cambian los roles o permisos del usuario</li>\n</ul>\n\n<p>Con esta configuración, tu aplicación Spring Boot estará protegida de forma moderna, escalable y segura usando JWT.</p>",
  "author": { "$oid": "661e0d45d118a84dfc6e4a97" },
  "category": { "$oid": "67ffdc40b9a42ae66ea5a8f6" },
  "tags": [
    { "$oid": "67ffdde680333f84f9253ca1" },
    { "$oid": "67ffdde680333f84f9253ca5" },
    { "$oid": "67ffdde680333f84f9253c9d" }
  ],
  "likes": [
    { "$oid": "661e0d45d118a84dfc6e4a99" },
    { "$oid": "661e0d45d118a84dfc6e4a98" }
  ],
  "favoritedBy": [
    { "$oid": "661e0d45d118a84dfc6e4a99" }
  ],
  "status": "published",
  "isVisible": true,
  "images": "",
  "generatedAt": { "$date": "2025-04-16T10:00:00.000Z" },
  "publishDate": { "$date": "2025-04-16T10:00:00.000Z" },
  "createdAt": { "$date": "2025-04-16T10:00:00.000Z" },
  "updatedAt": { "$date": "2025-04-16T10:00:00.000Z" }
}
