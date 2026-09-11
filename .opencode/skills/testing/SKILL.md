---
name: testing
description: Use when writing or reviewing tests for tutorNow. Covers JUnit 5 + Mockito for backend, Vitest for frontend, integration tests, and testing patterns.
---

# Testing Conventions - tutorNow

## Stack
- **Backend**: JUnit 5 + Mockito + Spring Boot Test
- **Frontend**: Vitest + React Testing Library

## Backend (Spring Boot)

### Estructura
```
src/test/java/co/edu/epi/tutornow/
├── auth/
│   ├── AuthControllerTest.java
│   ├── AuthServiceTest.java
│   └── AuthIntegrationTest.java
├── users/
├── tutoring/
└── ...
```

### Unit Tests (Service layer)
```java
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void shouldRegisterUserSuccessfully() {
        // Given
        RegisterRequest request = new RegisterRequest("test@elpoli.edu.co", "password", "Test User");
        when(userRepository.existsByEmail("test@elpoli.edu.co")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encoded");

        // When
        AuthResponse response = authService.register(request);

        // Then
        assertNotNull(response);
        verify(userRepository).save(any(Usuario.class));
    }

    @Test
    void shouldThrowExceptionWhenEmailAlreadyExists() {
        // Given
        RegisterRequest request = new RegisterRequest("existing@elpoli.edu.co", "password", "Test");
        when(userRepository.existsByEmail("existing@elpoli.edu.co")).thenReturn(true);

        // When & Then
        assertThrows(ConflictException.class, () -> authService.register(request));
    }
}
```

### Integration Tests
```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AuthControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldRegisterAndLogin() throws Exception {
        // Register
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@elpoli.edu.co\",\"password\":\"Pass123!\",\"fullName\":\"Test\"}"))
                .andExpect(status().isOk());

        // Login
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@elpoli.edu.co\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
```

### Coverage mínimo
- Services: 80%+ lines
- Controllers: test de todos los endpoints happy path + error cases
- Utils: 90%+

### Convenciones backend
- **Given-When-Then** para estructura de tests
- **@DisplayName** para describir escenarios en español
- **@MockBean** para dependencias en integration tests
- **@Testcontainers** para base de datos de pruebas
- Un test por escenario
- Nombre del método: `should{ExpectedBehavior}When{Condition}`

## Frontend (Vitest)

### Estructura
```
src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   └── LoginForm.test.tsx
├── hooks/
│   └── useLogin.test.ts
└── ...
```

### Component Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('should render email and password inputs', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('should show error when submitting empty fields', async () => {
    render(<LoginForm />)

    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByText(/campo requerido/i)).toBeInTheDocument()
  })

  it('should call onSubmit with valid data', async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/correo/i), {
      target: { value: 'test@elpoli.edu.co' }
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'Pass123!' }
    })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@elpoli.edu.co',
      password: 'Pass123!'
    })
  })
})
```

### Hook Tests
```tsx
import { renderHook, act } from '@testing-library/react'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login('test@elpoli.edu.co', 'Pass123!')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeDefined()
  })
})
```

### Coverage mínimo
- Components: render + interacciones básicas
- Hooks: todos los casos de uso
- Utils: 90%+

## Testing patterns

### User Feedback states
Siempre testear los tres estados:
```tsx
it('should show loading state', () => { ... })
it('should show error state on failure', () => { ... })
it('should show content on success', () => { ... })
it('should show empty state when no data', () => { ... })
```

### API mocking
```typescript
// Backend: MockMvc o @MockBean
// Frontend: vi.mock() o MSW (Mock Service Worker)
```

## Reglas
- Tests atómicos: un escenario por test
- Sin dependencias entre tests
- Datos de prueba claros y auto-contenidos
- Tests que se ejecuten rápido (< 1s por test unitario)
- Sin comentarios ni emojis en tests
