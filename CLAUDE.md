# CLAUDE.md — MiDineroIA Frontend (Angular)

## Descripción del Proyecto

MiDineroIA es un asistente financiero inteligente con IA. Este es el proyecto frontend en Angular que se conecta a un backend de Azure Functions (.NET/C#).

La app tiene 4 componentes principales ya creados con su UI:
- **LoginComponent** — Pantalla de inicio de sesión
- **RegisterComponent** — Pantalla de registro de usuario
- **DashboardComponent** — Pantalla 1: Resumen financiero mensual
- **RegistrarComponent** — Pantalla 2: Chat tipo WhatsApp para registrar gastos

**IMPORTANTE: La UI ya está construida. Solo falta conectar los endpoints del backend. NO modificar los colores, estilos ni diseño existente. Mantener el diseño responsive actual.**

---

## Diseño Responsive

La app debe funcionar en web y móvil:

**Vista Web (escritorio):** Estilo similar a WhatsApp Web. El RegistrarComponent se ve como un chat amplio con espacio para los mensajes y el input abajo.

**Vista Móvil:** Estilo similar a WhatsApp móvil tradicional. Las pantallas ocupan toda la pantalla del dispositivo. La navegación es mediante la barra inferior (navbar).

**Ambas vistas** ya están implementadas en los componentes actuales. Al conectar los endpoints, respetar el diseño responsive existente.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Angular |
| Hosting | Vercel |
| HTTP Client | HttpClient de Angular |
| Auth | JWT (almacenado en memoria/localStorage) |
| Gráficos | Chart.js o ngx-charts (para dona del dashboard) |

---

## Estructura del Proyecto

```
src/app/
├── core/                          # Singleton — se carga 1 vez
│   ├── services/
│   │   ├── auth.service.ts        # Login, register, logout, guardar token
│   │   ├── chat.service.ts        # POST /api/chat, GET history
│   │   ├── dashboard.service.ts   # GET /api/dashboard
│   │   ├── budget.service.ts      # PUT /api/budgets
│   │   └── transaction.service.ts # Confirm, edit, delete transacciones
│   ├── interceptors/
│   │   ├── auth.interceptor.ts    # Agrega JWT a cada request automáticamente
│   │   └── error.interceptor.ts   # Maneja 401 → redirige a login
│   ├── guards/
│   │   └── auth.guard.ts          # Protege rutas si no hay token
│   └── models/
│       ├── user.model.ts
│       ├── chat.model.ts
│       ├── dashboard.model.ts
│       └── transaction.model.ts
├── pages/
│   ├── login/                     # LoginComponent (ya creado)
│   ├── register/                  # RegisterComponent (ya creado)
│   ├── dashboard/                 # DashboardComponent (ya creado) — Pantalla 1
│   └── registrar/                 # RegistrarComponent (ya creado) — Pantalla 2 (Chat)
├── shared/
│   └── components/
│       ├── navbar/                # Barra inferior Dashboard | Registrar
│       └── (otros componentes compartidos existentes)
├── app.component.ts
└── app.routes.ts
```

---

## Componentes Existentes

### LoginComponent
- Formulario con email y password
- Botón de login
- Link a registro
- **Conectar a:** POST /api/auth/login
- **Al éxito:** Guardar token JWT, redirigir a /dashboard

### RegisterComponent
- Formulario con nombre, email, password
- Botón de registro
- Link a login
- **Conectar a:** POST /api/auth/register
- **Al éxito:** Guardar token JWT, redirigir a /dashboard

### DashboardComponent (Pantalla 1)
- Selector de mes/año arriba
- 3 tarjetas de resumen: Saldo, Ingresos Totales, Egresos Totales
- Tabla Resumen de Ingresos (Categoría, Ppto, Real)
- Tabla Resumen de Egresos (Categoría, Ppto, Real)
- Tablas de desglose: Servicios, Gastos (Categoría, Ppto, Real)
- Gráfico de dona: Distribución de Egresos
- Celdas de Ppto editables inline
- Navbar inferior
- **Conectar a:** GET /api/dashboard, PUT /api/budgets

### RegistrarComponent (Pantalla 2 — Chat)
- Header con logo y nombre "MiDineroIA"
- Área de mensajes tipo WhatsApp (burbujas verdes del usuario, grises de la IA)
- Tarjetas de confirmación de la IA con botones "Confirmar" y "Editar"
- Campo de texto abajo para escribir gastos
- Botón de adjuntar imagen (clip)
- Botón de enviar
- Navbar inferior
- **Conectar a:** POST /api/chat, GET /api/chat/history, PUT /api/transactions/{id}/confirm, PUT /api/transactions/{id}, DELETE /api/transactions/{id}

---

## API Backend — Endpoints

**Base URL:** Configurar como variable de entorno
- Desarrollo: `http://localhost:7071`
- Producción: `https://midinero-api.azurewebsites.net`

**Autenticación:** Todos los endpoints excepto auth requieren JWT en header:
`Authorization: Bearer {token}`

### Auth (sin JWT)

**POST /api/auth/register**
```
Request:  { "name": "string", "email": "string", "password": "string" }
Response: { "token": "jwt_string", "user": { "id": int, "name": "string", "email": "string" } }
Errores:  409 = email ya existe
```

**POST /api/auth/login**
```
Request:  { "email": "string", "password": "string" }
Response: { "token": "jwt_string", "user": { "id": int, "name": "string", "email": "string" } }
Errores:  401 = credenciales inválidas
```

### Chat (requiere JWT)

**POST /api/chat** — Enviar mensaje de texto o imagen a la IA
```
Request: { 
  "message": "string",           // Texto del usuario
  "image_base64": "string|null"  // Base64 de imagen (si aplica)
}
Response: {
  "intent": "REGISTER_TRANSACTION|SET_BUDGET|GENERAL_QUERY",
  "transaction_id": int|null,
  "message": "string",           // Texto que la IA muestra al usuario
  "data": {                      // Datos estructurados según intent
    // Para REGISTER_TRANSACTION:
    "transaction_type": "INGRESO|EGRESO",
    "amount": decimal,
    "category_name": "string",
    "category_id": int,
    "description": "string",
    "merchant": "string|null",
    "transaction_date": "YYYY-MM-DD",
    "confidence_score": int       // 0-100
    // Para SET_BUDGET:
    "budgets": [{ "category_name": string, "category_id": int, "amount": decimal, "year": int, "month": int }]
    // Para GENERAL_QUERY:
    "query_type": "GREETING|MONTHLY_SUMMARY|BUDGET_STATUS|TOP_EXPENSES"
  },
  "needs_confirmation": bool,
  "budget_info": {               // Solo si existe presupuesto para esa categoría
    "budget": decimal,
    "spent": decimal,
    "remaining": decimal
  } | null,
  "suggested_alternatives": [    // Solo si confidence_score < 70
    { "category_name": "string", "category_id": int }
  ] | null
}
```

**GET /api/chat/history?page=1&pageSize=20** — Historial de mensajes
```
Response: {
  "messages": [
    {
      "id": int,
      "message_type": "USER_TEXT|USER_IMAGE|AI_RESPONSE",
      "content": "string",
      "image_url": "string|null",
      "created_at": "datetime"
    }
  ],
  "total_count": int,
  "page": int,
  "page_size": int
}
```

### Transactions (requiere JWT)

**PUT /api/transactions/{id}/confirm** — Botón "Confirmar" del chat
```
Response: 200 OK
```

**PUT /api/transactions/{id}** — Botón "Editar" del chat
```
Request: { "category_id": int, "amount": decimal, "description": "string" }
Response: 200 OK con transacción actualizada
```

**DELETE /api/transactions/{id}** — Eliminar gasto
```
Response: 200 OK
```

### Dashboard (requiere JWT)

**GET /api/dashboard?year=2026&month=3** — Toda la data de la Pantalla 1
```
Response: {
  "summary": {
    "total_income": decimal,
    "total_expenses": decimal,
    "balance": decimal
  },
  "income_detail": [
    { "category": "string", "budget": decimal, "real": decimal }
  ],
  "expense_groups": [
    {
      "group_name": "string",
      "categories": [
        { "category": "string", "budget": decimal, "real": decimal }
      ]
    }
  ],
  "expense_distribution": [
    { "group": "string", "total": decimal, "percentage": decimal }
  ]
}
```

### Budgets (requiere JWT)

**PUT /api/budgets** — Editar presupuesto inline desde el dashboard
```
Request: { "category_id": int, "year": int, "month": int, "amount": decimal }
Response: 200 OK
```

### Categories (requiere JWT)

**GET /api/categories** — Listar categorías agrupadas
```
Response: {
  "groups": [
    {
      "name": "string",
      "type": "INGRESO|EGRESO",
      "categories": [{ "id": int, "name": "string" }]
    }
  ]
}
```

---

## Flujos de la App

### Flujo de Auth
1. Usuario abre la app → auth.guard verifica si hay token
2. Sin token → redirige a /login
3. Con token válido → redirige a /dashboard
4. Login/Register exitoso → guardar token → redirigir a /dashboard
5. Token expirado (401) → error.interceptor limpia token → redirige a /login

### Flujo del Chat (RegistrarComponent)
1. Al abrir la pantalla → GET /api/chat/history para cargar mensajes previos
2. Usuario escribe texto → POST /api/chat → mostrar respuesta de la IA como burbuja
3. Si intent = REGISTER_TRANSACTION → mostrar tarjeta de confirmación con "Confirmar" y "Editar"
4. Botón "Confirmar" → PUT /api/transactions/{id}/confirm
5. Botón "Editar" → mostrar formulario de edición → PUT /api/transactions/{id}
6. Usuario sube imagen → convertir a base64 → POST /api/chat con image_base64
7. Si intent = SET_BUDGET → mostrar tarjeta de confirmación de presupuestos
8. Si intent = GENERAL_QUERY → solo mostrar el mensaje como burbuja normal
9. Scroll automático al último mensaje después de cada respuesta

### Flujo del Dashboard (DashboardComponent)
1. Al abrir la pantalla → GET /api/dashboard con año y mes actual
2. Cambiar selector de mes → GET /api/dashboard con nuevo año/mes
3. Renderizar tarjetas de resumen, tablas y gráfico de dona con los datos
4. Celdas de Ppto editables: al tocar → campo editable → al confirmar → PUT /api/budgets
5. Después del PUT → refrescar dashboard con GET /api/dashboard

---

## Routing

```typescript
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'registrar', component: RegistrarComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
```

---

## Interceptors

### auth.interceptor.ts
Agrega el header `Authorization: Bearer {token}` a TODOS los requests HTTP automáticamente, excepto a los endpoints de /api/auth/*.

### error.interceptor.ts
Intercepta respuestas con status 401 → limpia el token del almacenamiento → redirige a /login.

---

## Almacenamiento del Token JWT

El token se guarda al hacer login/register y se usa en cada request.
Opciones de almacenamiento:
- **localStorage** — Persiste entre sesiones. Más simple. Aceptable para MVP.
- **Memoria (variable en servicio)** — Más seguro pero se pierde al refrescar.

Para el MVP usar **localStorage**. El auth.service.ts maneja guardar, leer y eliminar el token.

---

## Validaciones en Frontend

### Login/Register
- Email formato válido
- Password mínimo 6 caracteres
- Nombre requerido (registro)
- Mostrar errores del backend (409 email duplicado, 401 credenciales inválidas)

### Chat (subir imagen)
- Máximo 5MB
- Solo formatos JPG, PNG, WEBP
- Mostrar preview de la imagen antes de enviar
- Mostrar loading mientras se procesa

### Dashboard (inline edit de Ppto)
- Solo números positivos
- Formato de moneda USD

---

## Manejo de Errores en Frontend

| Error | Acción |
|-------|--------|
| 401 Unauthorized | error.interceptor redirige a /login |
| 409 Conflict (registro) | Mostrar "El email ya está registrado" |
| 500 Server Error | Mostrar "Algo salió mal, intenta de nuevo" |
| Timeout / Sin red | Mostrar "Sin conexión, verifica tu internet" |
| IA no pudo procesar | Mostrar el mensaje amigable que devuelve el backend |
| Imagen muy grande | Mostrar "La imagen debe ser menor a 5MB" antes de enviar |

---

## Variables de Entorno

```typescript
// environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:7071'
};

// environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://midinero-api.azurewebsites.net'
};
```

---

## Contexto Regional

La app está orientada a usuarios de **El Salvador**. La moneda es USD ($). Los textos de la UI deben estar en español. Los formatos de fecha son DD/MM/YYYY. Los montos se muestran como $1,200.00.
