@echo off
echo ============================================
echo    NossaSinais - Build Hibrido (Web + APK)
echo ============================================
echo.

echo [1/3] Compilando o codigo web (React)...
call npm run build
if errorlevel 1 (
  echo ERRO no build web! Verifique o codigo.
  pause
  exit /b 1
)
echo.

echo [2/3] Sincronizando com o Android (Capacitor)...
call npx cap sync android
if errorlevel 1 (
  echo ERRO no sync Android!
  pause
  exit /b 1
)
echo.

echo [3/3] Abrindo no Android Studio para gerar o APK...
call npx cap open android
echo.

echo ============================================
echo  Pronto! No Android Studio:
echo  1. Aguarde o Gradle terminar de carregar
echo  2. Va em Build > Build Bundle(s) / APK(s)
echo  3. Clique em "Build APK(s)"
echo  4. O arquivo .apk estara em:
echo     android\app\build\outputs\apk\debug\
echo ============================================
pause
