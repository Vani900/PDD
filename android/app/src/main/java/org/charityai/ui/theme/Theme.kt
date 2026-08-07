package org.charityai.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = EmeraldPrimary,
    onPrimary = Color.White,
    primaryContainer = EmeraldDark,
    secondary = BlueAccent,
    tertiary = PurpleAccent,
    background = BackgroundDark,
    surface = SurfaceDark,
    surfaceVariant = CardDark,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    outline = BorderDark,
)

@Composable
fun CharityAITheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
