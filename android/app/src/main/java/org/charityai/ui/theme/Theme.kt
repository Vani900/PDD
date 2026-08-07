package org.charityai.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Primary500,
    secondary = Accent500,
    background = Color(0xFFF8FAFC),
    surface = Color.White,
)

private val DarkColorScheme = darkColorScheme(
    primary = Primary500,
    secondary = Accent500,
    background = BackgroundDark,
    surface = CardDark,
)

@Composable
fun CharityAITheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
