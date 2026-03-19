# Pseudocode: Conversión de Grados Celsius a Fahrenheit

## Descripción
Convierte una temperatura dada en grados Celsius a su equivalente en grados Fahrenheit.

## Fórmula
```
F = C * (9/5) + 32
```

## Pseudocode

```
INICIO

  // Declarar variables
  DECLARAR celsius COMO REAL
  DECLARAR fahrenheit COMO REAL

  // Entrada de datos
  ESCRIBIR "Ingrese la temperatura en grados Celsius:"
  LEER celsius

  // Validar entrada
  SI celsius < -273.15 ENTONCES
    ESCRIBIR "Error: La temperatura no puede ser menor que el cero absoluto (-273.15 °C)"
  SI NO
    // Aplicar la fórmula de conversión
    fahrenheit ← celsius * (9 / 5) + 32

    // Mostrar el resultado
    ESCRIBIR "La temperatura en Fahrenheit es: " + fahrenheit + " °F"
  FIN SI

FIN
```

## Ejemplo

| Celsius (°C) | Fahrenheit (°F) |
|:------------:|:---------------:|
| 0            | 32              |
| 100          | 212             |
| -40          | -40             |
| 37           | 98.6            |
