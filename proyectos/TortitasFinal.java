import java.util.ArrayList;
import java.util.Collections;
import java.util.Scanner;
public class TortitasFinal {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String stop = null;
        ArrayList<Integer> tortitasFinales = new ArrayList<>();
        do {
            ArrayList<Integer> tortitasList = new ArrayList<>();
            String tortitas, volteos;
            int size = 0, pos = 0, tortitaFinal;
            boolean outOfBounds = false;
            tortitas = sc.nextLine();
            if (tortitas.isEmpty()) continue;
            stop = tortitas.trim();
            if (!stop.equals("-1")) {
                for (String num : tortitas.trim().split("\\s+")) {
                    if (num.equals("-1")) break;
                    tortitasList.add(Integer.parseInt(num));
                }
            }else{
                if (sc.hasNextLine()) sc.nextLine();
                break;
            }
            volteos = sc.nextLine();
            String[] partes = volteos.trim().split("\\s+");
            if (partes.length == 0) continue;
            for (String parte : partes) {
                int parteInt = Integer.parseInt(parte);
                if (!parte.equals(partes[0])) {
                    if (parteInt < 0 || parteInt > tortitasList.size()) {
                        outOfBounds = true;
                    }
                }
            }
            if (!outOfBounds) {
                size = Integer.parseInt(partes[0]);
                if (size == 0){
                    tortitaFinal = tortitasList.get(tortitasList.size() - 1);
                    tortitasFinales.add(tortitaFinal);
                    continue;
                }
                if (size != partes.length-1) {
                    continue;
                }
                int[] volteosArray = new int[size];
                for (int i = 1; i <= size; i++) {
                    volteosArray[i - 1] = Integer.parseInt(partes[i]);
                }
                for (int i = 0; i < size; i++) {
                    pos = (tortitasList.size()) - volteosArray[i];
                    Collections.reverse(tortitasList.subList(pos, tortitasList.size()));
                }
                if(tortitasList.isEmpty()) continue;
            }
            if (!outOfBounds && size == partes.length - 1) {
                tortitaFinal = tortitasList.get(tortitasList.size() - 1);
                tortitasFinales.add(tortitaFinal);
            } else {
                tortitaFinal = tortitasList.get(tortitasList.size() - 1);
                tortitasFinales.add(tortitaFinal);
            }
        } while (true);
        for (int element : tortitasFinales) {
            System.out.println(element);
        }
    }
}