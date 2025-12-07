import java.util.Scanner;
public class A3_4 {
    public static void main(String[] args)
    {
        Scanner sc = new Scanner(System.in);
        int estudiantes, tamanyo_equipos, equipos_formados, estudiantes_sobrantes;
        System.out.println("Introduzca el número de estudiantes del grupo");
        estudiantes = sc.nextInt();
        System.out.println("Introduzca el tamaño de los equipos que se formarán");
        tamanyo_equipos = sc.nextInt();
        equipos_formados = estudiantes / tamanyo_equipos;
        estudiantes_sobrantes = estudiantes % tamanyo_equipos;
        System.out.println("Se formarán " + equipos_formados + " equipos, y sobrarán " + estudiantes_sobrantes  + " estudiantes");
    }
}
