-- Limpieza de la cuenta que crea el navegador de pruebas del entorno de desarrollo.
delete from public.accounts
 where id in (select account_id from public.devices where device_id = 'DEV-015AE8BC-TKNEL8')
    or alias in ('AmigoPrueba', 'Chef_2279');
